using System.Security.Claims;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/assembly")]
public class AssemblyController : ControllerBase
{
    private const int MaxTitleLength = 200;

    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;
    private readonly IAssemblyNotifier _notifier;
    private readonly IAssemblyPresenceTracker _presence;

    public AssemblyController(
        AppDbContext db,
        IAuditLogger audit,
        IAssemblyNotifier notifier,
        IAssemblyPresenceTracker presence)
    {
        _db = db;
        _audit = audit;
        _notifier = notifier;
        _presence = presence;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue("userId")!);

    // -----------------------------------------------------------------------
    // Sessions
    // -----------------------------------------------------------------------

    /// <summary>Every sitting, newest first. Optionally filtered by status.</summary>
    [HttpGet("sessions")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(IEnumerable<AssemblySessionResponse>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetSessions([FromQuery] string? status)
    {
        if (status != null && !AssemblySessionStatus.IsKnown(status))
            return BadRequest(new { message = "Nepoznat status sednice." });

        var query = _db.AssemblySessions.AsNoTracking().AsQueryable();

        if (status != null)
            query = query.Where(s => s.Status == status);

        var sessions = await query
            .Include(s => s.CreatedByUser)
            .Include(s => s.Attendances)
            .Include(s => s.Topics)
            .OrderByDescending(s => s.ScheduledAt)
            .ThenByDescending(s => s.Id)
            .ToListAsync();

        var eligibleCount = await AssemblyEligibility.Roll(_db).CountAsync();
        var me = CurrentUserId;

        return Ok(sessions.Select(s => ToResponse(s, eligibleCount, me)).ToList());
    }

    /// <summary>
    /// The sitting the panel should open on: the one in progress, else the next
    /// scheduled one, else the most recent. Saves the client a round trip and a
    /// guess about which of the three it is.
    /// </summary>
    [HttpGet("sessions/current")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(AssemblySessionResponse), 200)]
    [ProducesResponseType(204)]
    public async Task<IActionResult> GetCurrentSession()
    {
        var sessions = await _db.AssemblySessions.AsNoTracking()
            .Include(s => s.CreatedByUser)
            .Include(s => s.Attendances)
            .Include(s => s.Topics)
            .ToListAsync();

        var chosen =
            sessions.FirstOrDefault(s => s.Status == AssemblySessionStatus.InProgress)
            ?? sessions.Where(s => s.Status == AssemblySessionStatus.Scheduled)
                       .OrderBy(s => s.ScheduledAt)
                       .FirstOrDefault()
            ?? sessions.OrderByDescending(s => s.ScheduledAt).FirstOrDefault();

        if (chosen is null) return NoContent();

        var eligibleCount = await AssemblyEligibility.Roll(_db).CountAsync();
        return Ok(ToResponse(chosen, eligibleCount, CurrentUserId));
    }

    /// <summary>One sitting.</summary>
    [HttpGet("sessions/{id:int}")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(AssemblySessionResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetSession(int id)
    {
        var session = await LoadSessionAsync(id);
        if (session is null) return NotFound();

        var eligibleCount = await AssemblyEligibility.Roll(_db).CountAsync();
        return Ok(ToResponse(session, eligibleCount, CurrentUserId));
    }

    /// <summary>
    /// The hall: one seat per member of the roll, with what he answered, whether
    /// he checked in, and whether he is connected right now.
    /// </summary>
    /// <remarks>
    /// The roster is assembled here rather than on the client because
    /// <c>GET /api/users</c> is Admin-only, so an ordinary member reading the
    /// hall would get a 403. Only what a seat renders is returned; no e-mail.
    /// </remarks>
    [HttpGet("sessions/{id:int}/hall")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(AssemblyHallResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetHall(int id)
    {
        var session = await LoadSessionAsync(id);
        if (session is null) return NotFound();

        var roll = await AssemblyEligibility.Roll(_db)
            .AsNoTracking()
            .Select(u => new { u.Id, u.Username, u.Role })
            .OrderBy(u => u.Username)
            .ToListAsync();

        var attendance = session.Attendances.ToDictionary(a => a.UserId);
        var live = _presence.UserIdsInSession(id);

        var seats = roll.Select(u =>
        {
            attendance.TryGetValue(u.Id, out var row);
            return new AssemblySeatResponse(
                u.Id,
                u.Username,
                u.Role,
                row?.Response,
                row?.CheckedInAt,
                row?.CheckInMode,
                live.Contains(u.Id));
        }).ToList();

        return Ok(new AssemblyHallResponse(
            ToResponse(session, roll.Count, CurrentUserId),
            seats,
            roll.Count,
            seats.Count(s => s.CheckedInAt != null)));
    }

    /// <summary>Schedule a sitting.</summary>
    [HttpPost("sessions")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblySessionResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateSession([FromBody] CreateAssemblySessionRequest request)
    {
        var error = ValidateSession(request.Title, request.OnlineUrl, request.QuorumRequired);
        if (error != null) return BadRequest(new { message = error });

        var session = new AssemblySession
        {
            Title = request.Title.Trim(),
            // UtcDateTime, not the raw value: Npgsql writes a timestamptz only
            // from a DateTime whose Kind is Utc.
            ScheduledAt = request.ScheduledAt.UtcDateTime,
            Location = Blank(request.Location),
            OnlineUrl = Blank(request.OnlineUrl),
            Description = Blank(request.Description),
            QuorumRequired = request.QuorumRequired,
            Status = AssemblySessionStatus.Scheduled,
            CreatedByUserId = CurrentUserId
        };

        _db.AssemblySessions.Add(session);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(AuditActions.AssemblySessionCreate,
            AuditEntityTypes.AssemblySession, session.Id.ToString(), Describe(session));

        var saved = await LoadSessionAsync(session.Id);
        var eligibleCount = await AssemblyEligibility.Roll(_db).CountAsync();

        return CreatedAtAction(nameof(GetSession), new { id = session.Id },
            ToResponse(saved!, eligibleCount, CurrentUserId));
    }

    /// <summary>Edit a sitting that has not been held yet.</summary>
    [HttpPut("sessions/{id:int}")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblySessionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateAssemblySessionRequest request)
    {
        var session = await _db.AssemblySessions.FindAsync(id);
        if (session is null) return NotFound();

        if (session.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled)
            return BadRequest(new { message = "Završena ili otkazana sednica se više ne menja." });

        var error = ValidateSession(request.Title, request.OnlineUrl, request.QuorumRequired);
        if (error != null) return BadRequest(new { message = error });

        session.Title = request.Title.Trim();
        session.ScheduledAt = request.ScheduledAt.UtcDateTime;
        session.Location = Blank(request.Location);
        session.OnlineUrl = Blank(request.OnlineUrl);
        session.Description = Blank(request.Description);
        session.QuorumRequired = request.QuorumRequired;
        session.UpdatedAt = DateTime.UtcNow;

        _audit.Record(AuditActions.AssemblySessionUpdate,
            AuditEntityTypes.AssemblySession, session.Id.ToString(), Describe(session));

        await _db.SaveChangesAsync();

        return Ok(await BroadcastSessionAsync(id));
    }

    /// <summary>Open, close or cancel a sitting.</summary>
    [HttpPut("sessions/{id:int}/status")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblySessionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> SetSessionStatus(int id, [FromBody] SetAssemblySessionStatusRequest request)
    {
        if (!AssemblySessionStatus.IsKnown(request.Status))
            return BadRequest(new { message = "Nepoznat status sednice." });

        var session = await _db.AssemblySessions.FindAsync(id);
        if (session is null) return NotFound();

        if (session.Status == request.Status)
            return Ok(await BroadcastSessionAsync(id));

        var error = WhyCannotChangeStatus(session.Status, request.Status);
        if (error != null) return BadRequest(new { message = error });

        if (request.Status == AssemblySessionStatus.InProgress)
        {
            // The filtered unique index enforces this too, but a chairman
            // deserves a sentence rather than a 500 from a constraint.
            var alreadyOpen = await _db.AssemblySessions
                .AnyAsync(s => s.Id != id && s.Status == AssemblySessionStatus.InProgress);

            if (alreadyOpen)
                return Conflict(new { message = "Druga sednica je već u toku. Prvo nju zatvorite." });

            session.OpenedAt = DateTime.UtcNow;
        }

        if (request.Status == AssemblySessionStatus.Finished)
            session.ClosedAt = DateTime.UtcNow;

        session.Status = request.Status;
        session.UpdatedAt = DateTime.UtcNow;

        _audit.Record(AuditActionForStatus(request.Status),
            AuditEntityTypes.AssemblySession, session.Id.ToString(), Describe(session));

        await _db.SaveChangesAsync();

        return Ok(await BroadcastSessionAsync(id));
    }

    /// <summary>
    /// Delete a sitting. Refused once an agenda hangs off it: an agenda item is
    /// a record, and the FK behind this is RESTRICT for the same reason.
    /// </summary>
    [HttpDelete("sessions/{id:int}")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteSession(int id)
    {
        var session = await _db.AssemblySessions
            .Include(s => s.Topics)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session is null) return NotFound();

        if (session.Topics.Count > 0)
            return BadRequest(new
            {
                message = "Sednica ima tačke dnevnog reda i ne može se obrisati. Otkažite je umesto toga."
            });

        if (session.Status == AssemblySessionStatus.Finished)
            return BadRequest(new { message = "Održana sednica se ne briše — ona je zapis." });

        _audit.Record(AuditActions.AssemblySessionDelete,
            AuditEntityTypes.AssemblySession, session.Id.ToString(), Describe(session));

        _db.AssemblySessions.Remove(session);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Sednica obrisana." });
    }

    // -----------------------------------------------------------------------
    // Attendance
    // -----------------------------------------------------------------------

    /// <summary>Answer the invitation: coming, online, unsure, or not coming.</summary>
    [HttpPut("sessions/{id:int}/rsvp")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblySeatResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> SetRsvp(int id, [FromBody] SetRsvpRequest request)
    {
        if (!AssemblyRsvp.IsKnown(request.Response))
            return BadRequest(new { message = "Nepoznat odgovor na poziv." });

        var session = await _db.AssemblySessions.FindAsync(id);
        if (session is null) return NotFound();

        if (session.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled)
            return BadRequest(new { message = "Sednica je zatvorena — najava se više ne menja." });

        var row = await UpsertAttendanceAsync(id, CurrentUserId);
        row.Response = request.Response;
        row.Note = Blank(request.Note);
        row.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(await BroadcastSeatAsync(id, CurrentUserId));
    }

    /// <summary>
    /// Record that you are actually here. Separate from the RSVP on purpose:
    /// one is what you planned, the other is what happened.
    /// </summary>
    [HttpPut("sessions/{id:int}/check-in")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblySeatResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CheckIn(int id, [FromBody] CheckInRequest request)
    {
        if (request.Mode != null && !AssemblyCheckInMode.IsKnown(request.Mode))
            return BadRequest(new { message = "Nepoznat način prisustva." });

        var session = await _db.AssemblySessions.FindAsync(id);
        if (session is null) return NotFound();

        if (session.Status != AssemblySessionStatus.InProgress)
            return BadRequest(new { message = "Prijava prisustva je moguća samo dok sednica traje." });

        var row = await UpsertAttendanceAsync(id, CurrentUserId);

        // A null mode is "I am leaving the floor", not a validation slip — the
        // same endpoint takes the seat back off.
        row.CheckedInAt = request.Mode is null ? null : DateTime.UtcNow;
        row.CheckInMode = request.Mode;
        row.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(await BroadcastSeatAsync(id, CurrentUserId));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Task<AssemblySession?> LoadSessionAsync(int id) =>
        _db.AssemblySessions.AsNoTracking()
            .Include(s => s.CreatedByUser)
            .Include(s => s.Attendances)
            .Include(s => s.Topics)
            .FirstOrDefaultAsync(s => s.Id == id);

    /// <summary>
    /// This member's attendance row for the sitting, created on first contact.
    /// Tracked, so the caller sets its fields and saves once.
    /// </summary>
    private async Task<AssemblyAttendance> UpsertAttendanceAsync(int sessionId, int userId)
    {
        var row = await _db.AssemblyAttendances
            .FirstOrDefaultAsync(a => a.SessionId == sessionId && a.UserId == userId);

        if (row != null) return row;

        row = new AssemblyAttendance { SessionId = sessionId, UserId = userId };
        _db.AssemblyAttendances.Add(row);
        return row;
    }

    /// <summary>
    /// Reloads one seat and pushes it to the room. Called only after the last
    /// SaveChanges has returned, never between two of them.
    /// </summary>
    private async Task<AssemblySeatResponse> BroadcastSeatAsync(int sessionId, int userId)
    {
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Username, u.Role })
            .FirstAsync();

        var row = await _db.AssemblyAttendances.AsNoTracking()
            .FirstOrDefaultAsync(a => a.SessionId == sessionId && a.UserId == userId);

        var seat = new AssemblySeatResponse(
            userId,
            user.Username,
            user.Role,
            row?.Response,
            row?.CheckedInAt,
            row?.CheckInMode,
            _presence.UserIdsInSession(sessionId).Contains(userId));

        await _notifier.SeatChangedAsync(sessionId, seat);
        return seat;
    }

    private async Task<AssemblySessionResponse> BroadcastSessionAsync(int sessionId)
    {
        var session = await LoadSessionAsync(sessionId);
        var eligibleCount = await AssemblyEligibility.Roll(_db).CountAsync();
        var dto = ToResponse(session!, eligibleCount, CurrentUserId);

        await _notifier.SessionChangedAsync(sessionId, dto);
        return dto;
    }

    private static string? ValidateSession(string? title, string? onlineUrl, int? quorum)
    {
        if (string.IsNullOrWhiteSpace(title))
            return "Naziv sednice je obavezan.";

        if (title.Trim().Length > MaxTitleLength)
            return $"Naziv sednice ne sme biti duži od {MaxTitleLength} znakova.";

        if (quorum is < 0)
            return "Kvorum ne može biti negativan.";

        // The link is rendered as an href, so the scheme is checked here rather
        // than trusting React to refuse a javascript: URL.
        if (!string.IsNullOrWhiteSpace(onlineUrl))
        {
            var ok = Uri.TryCreate(onlineUrl.Trim(), UriKind.Absolute, out var uri)
                     && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

            if (!ok) return "Link za online učešće mora počinjati sa http:// ili https://.";
        }

        return null;
    }

    /// <summary>
    /// The only legal moves between statuses. Finished and cancelled are
    /// terminal — reopening a sitting would make its ballots ambiguous.
    /// </summary>
    private static string? WhyCannotChangeStatus(string from, string to) => from switch
    {
        AssemblySessionStatus.Scheduled when to is AssemblySessionStatus.InProgress
                                               or AssemblySessionStatus.Cancelled => null,

        AssemblySessionStatus.InProgress when to is AssemblySessionStatus.Finished
                                                or AssemblySessionStatus.Cancelled => null,

        AssemblySessionStatus.Scheduled or AssemblySessionStatus.InProgress =>
            "Iz tog stanja sednica ne može preći u traženo.",

        _ => "Završena ili otkazana sednica se više ne otvara."
    };

    private static string AuditActionForStatus(string status) => status switch
    {
        AssemblySessionStatus.InProgress => AuditActions.AssemblySessionOpen,
        AssemblySessionStatus.Finished => AuditActions.AssemblySessionClose,
        AssemblySessionStatus.Cancelled => AuditActions.AssemblySessionCancel,
        _ => AuditActions.AssemblySessionUpdate
    };

    private static string Describe(AssemblySession s) =>
        $"{s.Title} — {s.ScheduledAt:dd.MM.yyyy. HH:mm} UTC";

    private static string? Blank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static AssemblySessionResponse ToResponse(AssemblySession s, int eligibleCount, int currentUserId)
    {
        var answered = s.Attendances;

        int CountOf(string response) => answered.Count(a => a.Response == response);

        var counts = new AssemblyRsvpCountsResponse(
            CountOf(AssemblyRsvp.Attending),
            CountOf(AssemblyRsvp.Online),
            CountOf(AssemblyRsvp.Unsure),
            CountOf(AssemblyRsvp.Absent),
            Math.Max(0, eligibleCount - answered.Count));

        return new AssemblySessionResponse(
            s.Id,
            s.Title,
            s.ScheduledAt,
            s.Location,
            s.OnlineUrl,
            s.Description,
            s.Status,
            s.QuorumRequired,
            s.CreatedByUser?.Username ?? "?",
            s.OpenedAt,
            s.ClosedAt,
            s.CreatedAt,
            s.Topics.Count,
            counts,
            answered.FirstOrDefault(a => a.UserId == currentUserId)?.Response);
    }
}
