using System.Security.Claims;
using System.Text.RegularExpressions;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

/// <summary>
/// Petitions and the signatures on them. Signatures are a sub-resource here
/// rather than a controller of their own, the same way the assembly keeps
/// ballots under the session that owns them.
///
/// Two rules run through the whole file and are worth stating once:
///
///  * A signature is special-category personal data (čl. 17 ZZPL). It is
///    written only with the server's own consent text, it is deleted the moment
///    the signer asks, and it is never written to the audit log.
///  * The public list shows only rows whose signer ticked the second, optional
///    box. Every query that leaves here for an anonymous caller filters on
///    <c>PublicDisplay</c>.
/// </summary>
[ApiController]
[Route("api/petitions")]
public class PetitionsController : ControllerBase
{
    private const int MaxTitleLength = 200;
    private const int MaxSummaryLength = 600;
    private const int MaxBodyLength = 50_000;
    private const int MaxRecipientLength = 200;
    private const int MaxNameLength = 60;
    private const int MaxCityLength = 80;
    private const int MaxGoal = 10_000_000;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;
    private readonly IHoneypotGuard _honeypot;

    public PetitionsController(AppDbContext db, IAuditLogger audit, IHoneypotGuard honeypot)
    {
        _db = db;
        _audit = audit;
        _honeypot = honeypot;
    }

    // Same split as the news panel: everyone the organisation admitted can see
    // a draft, only the Moderator gets buttons for it.
    private bool CanSeeDrafts => User.IsIn(Roles.ViewPanel);

    private int CurrentUserId => int.Parse(User.FindFirstValue("userId")!);

    // -----------------------------------------------------------------------
    // Reading petitions
    // -----------------------------------------------------------------------

    /// <summary>List petitions. Panel viewers also see drafts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PetitionListItemResponse>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var query = _db.Petitions.AsQueryable();

        if (!CanSeeDrafts)
            query = query.Where(p => p.Status != PetitionStatus.Draft);

        var rows = await query
            .OrderBy(p => p.DisplayOrder)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => new { Petition = p, Live = p.Signatures.Count() })
            .ToListAsync();

        var result = rows.Select(r => new PetitionListItemResponse(
            r.Petition.Id,
            r.Petition.Slug,
            r.Petition.Title,
            r.Petition.Summary,
            r.Petition.Recipient,
            r.Petition.ImageUrl,
            r.Petition.Goal,
            r.Petition.Status,
            r.Petition.ClosesAt,
            r.Petition.FinalSignatureCount ?? r.Live,
            r.Petition.CreatedAt));

        return Ok(result);
    }

    /// <summary>One petition, by slug. The page the public actually reads.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(PetitionDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var petition = await _db.Petitions.FirstOrDefaultAsync(p => p.Slug == slug);

        if (petition == null) return NotFound();
        if (petition.Status == PetitionStatus.Draft && !CanSeeDrafts) return NotFound();

        return Ok(await BuildDetailAsync(petition));
    }

    /// <summary>
    /// One petition by id, for the edit form. The news panel fetches the list
    /// and then the slug to fill a form; there is no reason to repeat that.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [ProducesResponseType(typeof(PetitionDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        return Ok(await BuildDetailAsync(petition));
    }

    // -----------------------------------------------------------------------
    // Writing petitions
    // -----------------------------------------------------------------------

    [HttpPost]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(PetitionDetailResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreatePetitionRequest request)
    {
        var error = ValidatePetition(
            request.Title, request.Summary, request.Body, request.Recipient,
            request.Goal, request.ClosesAt, requireFutureDeadline: true);

        if (error != null) return BadRequest(new { message = error });

        var petition = new Petition
        {
            Slug = await GenerateUniqueSlugAsync(request.Title),
            Title = request.Title.Trim(),
            Summary = request.Summary.Trim(),
            Body = request.Body.Trim(),
            Recipient = request.Recipient.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            Goal = request.Goal,
            ClosesAt = request.ClosesAt?.UtcDateTime,

            // Always a draft. Publishing is a second, deliberate click, because
            // the text freezes the moment the first person signs it.
            Status = PetitionStatus.Draft,
            CreatedByUserId = CurrentUserId
        };

        _db.Petitions.Add(petition);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(
            AuditActions.PetitionCreate, AuditEntityTypes.Petition,
            petition.Id.ToString(), petition.Title);

        var response = await BuildDetailAsync(petition);

        return CreatedAtAction(nameof(GetBySlug), new { slug = petition.Slug }, response);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(PetitionDetailResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePetitionRequest request)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        var hasSignatures = await _db.PetitionSignatures.AnyAsync(s => s.PetitionId == id);

        var blocked = PetitionRules.WhyCannotEdit(petition, hasSignatures);
        if (blocked != null) return BadRequest(new { message = blocked });

        var error = ValidatePetition(
            request.Title, request.Summary, request.Body, request.Recipient,
            request.Goal, request.ClosesAt, requireFutureDeadline: false);

        if (error != null) return BadRequest(new { message = error });

        petition.Title = request.Title.Trim();
        petition.Summary = request.Summary.Trim();
        petition.Body = request.Body.Trim();
        petition.Recipient = request.Recipient.Trim();
        petition.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        petition.Goal = request.Goal;
        petition.ClosesAt = request.ClosesAt?.UtcDateTime;
        petition.UpdatedAt = DateTime.UtcNow;

        _audit.Record(
            AuditActions.PetitionUpdate, AuditEntityTypes.Petition,
            petition.Id.ToString(), petition.Title);

        await _db.SaveChangesAsync();

        return Ok(await BuildDetailAsync(petition));
    }

    /// <summary>Open collection, or close it. The only two moves there are.</summary>
    [HttpPut("{id:int}/status")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(PetitionDetailResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> SetStatus(int id, [FromBody] PetitionStatusRequest request)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        string action;

        switch (request.Status)
        {
            case PetitionStatus.Open:
            {
                var blocked = PetitionRules.WhyCannotOpen(petition);
                if (blocked != null) return BadRequest(new { message = blocked });

                petition.Status = PetitionStatus.Open;
                petition.OpenedAt ??= DateTime.UtcNow;
                action = AuditActions.PetitionOpen;
                break;
            }

            case PetitionStatus.Closed:
            {
                var blocked = PetitionRules.WhyCannotClose(petition);
                if (blocked != null) return BadRequest(new { message = blocked });

                petition.Status = PetitionStatus.Closed;

                // Starts the retention clock. PetitionRetentionService counts
                // from here, so it is set once and never moved.
                petition.ClosedAt = DateTime.UtcNow;
                action = AuditActions.PetitionClose;
                break;
            }

            default:
                return BadRequest(new
                {
                    message = "Peticija se može samo otvoriti ili zatvoriti."
                });
        }

        petition.UpdatedAt = DateTime.UtcNow;

        _audit.Record(action, AuditEntityTypes.Petition, petition.Id.ToString(), petition.Title);

        await _db.SaveChangesAsync();

        return Ok(await BuildDetailAsync(petition));
    }

    /// <summary>Reorder the list. Returns the full reordered list, like news.</summary>
    [HttpPut("{id:int}/move")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(IEnumerable<PetitionListItemResponse>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Move(int id, [FromBody] MovePetitionRequest request)
    {
        if (request.Direction != "up" && request.Direction != "down")
            return BadRequest(new { message = "Smer mora biti 'up' ili 'down'." });

        var ordered = await _db.Petitions
            .OrderBy(p => p.DisplayOrder)
            .ThenByDescending(p => p.CreatedAt)
            .ToListAsync();

        for (int i = 0; i < ordered.Count; i++)
            ordered[i].DisplayOrder = i;

        var index = ordered.FindIndex(p => p.Id == id);
        if (index == -1) return NotFound();

        var targetIndex = request.Direction == "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= ordered.Count)
            return BadRequest(new { message = "Peticija je već na kraju u tom pravcu." });

        (ordered[index].DisplayOrder, ordered[targetIndex].DisplayOrder) =
            (ordered[targetIndex].DisplayOrder, ordered[index].DisplayOrder);

        _audit.Record(
            request.Direction == "up" ? AuditActions.PetitionMoveUp : AuditActions.PetitionMoveDown,
            AuditEntityTypes.Petition,
            ordered[index].Id.ToString(),
            ordered[index].Title);

        await _db.SaveChangesAsync();

        var counts = await _db.PetitionSignatures
            .GroupBy(s => s.PetitionId)
            .Select(g => new { PetitionId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PetitionId, x => x.Count);

        var result = ordered
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new PetitionListItemResponse(
                p.Id, p.Slug, p.Title, p.Summary, p.Recipient, p.ImageUrl, p.Goal,
                p.Status, p.ClosesAt,
                p.FinalSignatureCount ?? counts.GetValueOrDefault(p.Id),
                p.CreatedAt));

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        var hasSignatures = await _db.PetitionSignatures.AnyAsync(s => s.PetitionId == id);

        var blocked = PetitionRules.WhyCannotDelete(petition, hasSignatures);
        if (blocked != null) return BadRequest(new { message = blocked });

        _db.Petitions.Remove(petition);

        _audit.Record(
            AuditActions.PetitionDelete, AuditEntityTypes.Petition,
            petition.Id.ToString(), petition.Title);

        await _db.SaveChangesAsync();

        return Ok(new { message = "Peticija je obrisana." });
    }

    // -----------------------------------------------------------------------
    // Signing
    // -----------------------------------------------------------------------

    /// <summary>
    /// The public list of signatories. Only rows whose signer gave the separate
    /// publication consent, and the filter sits in the query rather than in the
    /// projection so a later change to the shape cannot leak the rest.
    /// </summary>
    [HttpGet("{slug}/signatures")]
    [ProducesResponseType(typeof(PublicSignaturePageResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetPublicSignatures(
        string slug, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var petition = await _db.Petitions.FirstOrDefaultAsync(p => p.Slug == slug);

        if (petition == null) return NotFound();
        if (petition.Status == PetitionStatus.Draft && !CanSeeDrafts) return NotFound();

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.PetitionSignatures
            .Where(s => s.PetitionId == petition.Id && s.PublicDisplay);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.SignedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new PublicSignatureResponse(s.FirstName, s.LastName, s.City, s.SignedAt))
            .ToListAsync();

        return Ok(new PublicSignaturePageResponse(items, total, page, pageSize));
    }

    /// <summary>
    /// Sign a petition. Requires an account — that account is what makes the
    /// signature attributable and what lets the signer withdraw it later.
    /// </summary>
    [HttpPost("{id:int}/signatures")]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.PetitionSign)]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> Sign(int id, [FromBody] SignPetitionRequest request)
    {
        var userId = CurrentUserId;

        // Ahead of everything else, so a bot gets the same answer whether or not
        // the rest of its body was well formed.
        if (await _honeypot.IsBotAsync(
                HttpContext, "petition-signatures", request.ContactReference, request, userId))
        {
            return StatusCode(201, new { message = "Hvala, vaš potpis je zabeležen." });
        }

        // The token lives seven days and carries whatever the account was then.
        // A signature written for a since-deactivated account would be a name on
        // a list nobody can answer for, so the row is read fresh — the same
        // reason AssemblyHub re-checks before letting anyone into the room.
        var signer = await _db.Users.FindAsync(userId);
        if (signer is null || !signer.IsActive)
            return StatusCode(403, new { message = "Vaš nalog nije aktivan." });

        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        var blocked = PetitionRules.WhyCannotSign(petition, DateTime.UtcNow);
        if (blocked != null) return BadRequest(new { message = blocked });

        var error = ValidateSignature(request);
        if (error != null) return BadRequest(new { message = error });

        var already = await _db.PetitionSignatures
            .AnyAsync(s => s.PetitionId == id && s.UserId == userId);

        if (already)
            return Conflict(new { message = "Već ste potpisali ovu peticiju." });

        var signature = new PetitionSignature
        {
            PetitionId = petition.Id,
            UserId = userId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            City = request.City.Trim(),
            PublicDisplay = request.PublicDisplay,

            // The server's own wording, never the client's. This is the record
            // that proves what was consented to (čl. 15 st. 1 ZZPL), and a
            // record written by the other party proves nothing.
            ConsentText = PetitionConsent.CurrentText,
            ConsentVersion = PetitionConsent.CurrentVersion,
            PublicDisplayConsentText = request.PublicDisplay
                ? PetitionConsent.PublicDisplayText
                : null
        };

        _db.PetitionSignatures.Add(signature);

        // Deliberately no audit row. See the comment on AuditActions.PetitionCreate:
        // logging "X signed petition Y" would put a political opinion into a
        // permanent record that outlives both withdrawal and retention.
        await _db.SaveChangesAsync();

        var count = await _db.PetitionSignatures.CountAsync(s => s.PetitionId == id);

        return StatusCode(201, new
        {
            message = "Hvala, vaš potpis je zabeležen.",
            signatureCount = count
        });
    }

    /// <summary>
    /// Withdraw consent, which deletes the signature. Not a flag, not a soft
    /// delete: consent withdrawn with the data kept is consent not withdrawn.
    /// The count drops, and the person is free to sign again.
    /// </summary>
    [HttpDelete("{id:int}/signatures/me")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> WithdrawSignature(int id)
    {
        var userId = CurrentUserId;

        var signature = await _db.PetitionSignatures
            .FirstOrDefaultAsync(s => s.PetitionId == id && s.UserId == userId);

        if (signature == null)
            return NotFound(new { message = "Niste potpisali ovu peticiju." });

        _db.PetitionSignatures.Remove(signature);

        // No audit row here either, and for a sharper reason than on signing:
        // a line saying this account withdrew from this petition would survive
        // the very deletion it describes.
        await _db.SaveChangesAsync();

        var count = await _db.PetitionSignatures.CountAsync(s => s.PetitionId == id);

        return Ok(new
        {
            message = "Potpis je povučen i obrisan.",
            signatureCount = count
        });
    }

    /// <summary>
    /// What the caller has signed, with the wording they agreed to. The right
    /// of access (čl. 26 ZZPL) at the scale this feature needs it.
    /// </summary>
    [HttpGet("my-signatures")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<MySignatureResponse>), 200)]
    public async Task<IActionResult> GetMySignatures()
    {
        var userId = CurrentUserId;

        var items = await _db.PetitionSignatures
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SignedAt)
            .Select(s => new MySignatureResponse(
                s.PetitionId,
                s.Petition.Slug,
                s.Petition.Title,
                s.Petition.Status,
                s.FirstName,
                s.LastName,
                s.City,
                s.PublicDisplay,
                s.ConsentText,
                s.ConsentVersion,
                s.SignedAt))
            .ToListAsync();

        return Ok(items);
    }

    // -----------------------------------------------------------------------
    // The panel's view of signatures
    // -----------------------------------------------------------------------

    /// <summary>Every signature on one petition, paged, for the panel.</summary>
    [HttpGet("{id:int}/signatures/all")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [ProducesResponseType(typeof(AdminSignaturePageResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetAllSignatures(
        int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (!await _db.Petitions.AnyAsync(p => p.Id == id)) return NotFound();

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.PetitionSignatures.Where(s => s.PetitionId == id);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.SignedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new AdminSignatureResponse(
                s.Id, s.FirstName, s.LastName, s.City,
                s.User.Username, s.PublicDisplay, s.ConsentVersion, s.SignedAt))
            .ToListAsync();

        return Ok(new AdminSignaturePageResponse(items, total, page, pageSize));
    }

    /// <summary>
    /// The whole list, unpaged, for a PDF export — and a POST rather than a GET
    /// because it leaves a mark. Pulling a few hundred names, cities and
    /// political opinions onto somebody's laptop is the one thing about this
    /// data worth a permanent record, so it gets the audit row that the
    /// individual signatures deliberately do not.
    /// </summary>
    [HttpPost("{id:int}/signatures/export")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(IEnumerable<AdminSignatureResponse>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ExportSignatures(int id)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        var items = await _db.PetitionSignatures
            .Where(s => s.PetitionId == id)
            .OrderByDescending(s => s.SignedAt)
            .Select(s => new AdminSignatureResponse(
                s.Id, s.FirstName, s.LastName, s.City,
                s.User.Username, s.PublicDisplay, s.ConsentVersion, s.SignedAt))
            .ToListAsync();

        await _audit.RecordAsync(
            AuditActions.PetitionSignaturesExport, AuditEntityTypes.Petition,
            petition.Id.ToString(),
            $"{petition.Title} ({items.Count} potpisa)");

        return Ok(items);
    }

    /// <summary>
    /// Delete every signature now, ahead of the retention job. The same
    /// operation <c>PetitionRetentionService</c> performs on a schedule, exposed
    /// so a moderator can honour a request without waiting a year.
    /// </summary>
    [HttpPost("{id:int}/purge-signatures")]
    [Authorize(Roles = Roles.ManagePetitions)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> PurgeSignatures(int id)
    {
        var petition = await _db.Petitions.FindAsync(id);
        if (petition == null) return NotFound();

        var signatures = await _db.PetitionSignatures
            .Where(s => s.PetitionId == id)
            .ToListAsync();

        var blocked = PetitionRules.WhyCannotPurge(petition, signatures.Count > 0);
        if (blocked != null) return BadRequest(new { message = blocked });

        var purged = signatures.Count;

        _db.PetitionSignatures.RemoveRange(signatures);

        petition.FinalSignatureCount = (petition.FinalSignatureCount ?? 0) + purged;
        petition.SignaturesPurgedAt = DateTime.UtcNow;
        petition.Status = PetitionStatus.Archived;
        petition.UpdatedAt = DateTime.UtcNow;

        _audit.Record(
            AuditActions.PetitionPurgeSignatures, AuditEntityTypes.Petition,
            petition.Id.ToString(),
            $"{petition.Title} ({purged} potpisa obrisano)");

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = $"Obrisano je {purged} potpisa. Peticija je arhivirana.",
            finalSignatureCount = petition.FinalSignatureCount
        });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private async Task<PetitionDetailResponse> BuildDetailAsync(Petition petition)
    {
        var live = await _db.PetitionSignatures.CountAsync(s => s.PetitionId == petition.Id);

        var viewerHasSigned = false;

        if (User.Identity?.IsAuthenticated == true)
        {
            var userId = CurrentUserId;

            viewerHasSigned = await _db.PetitionSignatures
                .AnyAsync(s => s.PetitionId == petition.Id && s.UserId == userId);
        }

        return new PetitionDetailResponse(
            petition.Id,
            petition.Slug,
            petition.Title,
            petition.Summary,
            petition.Body,
            petition.Recipient,
            petition.ImageUrl,
            petition.Goal,
            petition.Status,
            petition.ClosesAt,
            petition.ClosedAt,
            petition.SignaturesPurgedAt,
            petition.FinalSignatureCount ?? live,
            petition.CreatedAt,
            petition.UpdatedAt,
            PetitionRules.WhyCannotSign(petition, DateTime.UtcNow),
            viewerHasSigned,
            PetitionConsent.CurrentText,
            PetitionConsent.PublicDisplayText,
            PetitionConsent.LegalEffectNotice);
    }

    private static string? ValidatePetition(
        string? title, string? summary, string? body, string? recipient,
        int goal, DateTimeOffset? closesAt, bool requireFutureDeadline)
    {
        if (string.IsNullOrWhiteSpace(title))
            return "Naslov peticije je obavezan.";

        if (title.Trim().Length > MaxTitleLength)
            return $"Naslov ne sme biti duži od {MaxTitleLength} znakova.";

        if (string.IsNullOrWhiteSpace(summary))
            return "Kratak opis je obavezan.";

        if (summary.Trim().Length > MaxSummaryLength)
            return $"Kratak opis ne sme biti duži od {MaxSummaryLength} znakova.";

        if (string.IsNullOrWhiteSpace(body))
            return "Tekst peticije je obavezan.";

        if (body.Trim().Length > MaxBodyLength)
            return $"Tekst peticije ne sme biti duži od {MaxBodyLength} znakova.";

        // A petition addressed to nobody is a press release. Requiring this
        // keeps the page honest about what signing is meant to achieve.
        if (string.IsNullOrWhiteSpace(recipient))
            return "Morate navesti kome se peticija upućuje.";

        if (recipient.Trim().Length > MaxRecipientLength)
            return $"Primalac ne sme biti duži od {MaxRecipientLength} znakova.";

        if (goal < 0 || goal > MaxGoal)
            return "Ciljani broj potpisa nije ispravan.";

        if (requireFutureDeadline && closesAt is { } deadline && deadline <= DateTimeOffset.UtcNow)
            return "Rok za potpisivanje mora biti u budućnosti.";

        return null;
    }

    private static string? ValidateSignature(SignPetitionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName))
            return "Ime je obavezno.";

        if (request.FirstName.Trim().Length > MaxNameLength)
            return $"Ime ne sme biti duže od {MaxNameLength} znakova.";

        if (string.IsNullOrWhiteSpace(request.LastName))
            return "Prezime je obavezno.";

        if (request.LastName.Trim().Length > MaxNameLength)
            return $"Prezime ne sme biti duže od {MaxNameLength} znakova.";

        if (string.IsNullOrWhiteSpace(request.City))
            return "Grad je obavezan.";

        if (request.City.Trim().Length > MaxCityLength)
            return $"Grad ne sme biti duži od {MaxCityLength} znakova.";

        // Last, and never inferred from anything else: without this the whole
        // processing has no legal basis at all.
        if (!request.Consent)
            return "Morate dati izričit pristanak da biste potpisali peticiju.";

        return null;
    }

    private static readonly Dictionary<char, char> DiacriticsMap = new()
    {
        { 'č', 'c' }, { 'ć', 'c' }, { 'đ', 'd' }, { 'š', 's' }, { 'ž', 'z' }
    };

    private static string Slugify(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = new string(slug.Select(c => DiacriticsMap.TryGetValue(c, out var r) ? r : c).ToArray());
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }

    private async Task<string> GenerateUniqueSlugAsync(string title)
    {
        var baseSlug = Slugify(title);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "peticija";

        var slug = baseSlug;
        var suffix = 2;

        while (await _db.Petitions.AnyAsync(p => p.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }
}
