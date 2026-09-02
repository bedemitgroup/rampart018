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

    /// <summary>Whoever runs the assembly: the Skupstina role, or an Admin.</summary>
    private bool IsChair => User.IsIn(Roles.ManageAssembly);

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

        // What the room is deciding right now. Null between items, which is
        // what puts the hall back to showing attendance rather than votes.
        var active = session.Topics
            .FirstOrDefault(t => t.VotingStatus == AssemblyVotingStatus.Open);

        var activeTopic = active is null ? null : await ReloadTopicAsync(active.Id);
        var activeTally = active is null ? null : await BuildTallyAsync(active.Id);

        return Ok(new AssemblyHallResponse(
            ToResponse(session, roll.Count, CurrentUserId),
            seats,
            roll.Count,
            seats.Count(s => s.CheckedInAt != null),
            activeTopic,
            activeTally));
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
    // Agenda topics
    // -----------------------------------------------------------------------

    /// <summary>
    /// The agenda. Everyone sees what the chairman accepted; a member also sees
    /// his own proposals, whatever their status, so he can tell whether his
    /// point was taken up. Other people's unreviewed proposals stay private
    /// until they are ruled on.
    /// </summary>
    [HttpGet("topics")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(IEnumerable<AssemblyTopicResponse>), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetTopics([FromQuery] int? sessionId, [FromQuery] bool backlog = false)
    {
        var me = CurrentUserId;
        var isChair = IsChair;

        var query = _db.AssemblyTopics.AsNoTracking()
            .Include(t => t.Session)
            .Include(t => t.ProposedByUser)
            .Include(t => t.ReviewedByUser)
            .AsQueryable();

        if (backlog)
            query = query.Where(t => t.SessionId == null);
        else if (sessionId is int wanted)
            query = query.Where(t => t.SessionId == wanted);

        if (!isChair)
            query = query.Where(t => t.Status == AssemblyTopicStatus.Accepted || t.ProposedByUserId == me);

        var topics = await InAgendaOrder(query).ToListAsync();

        return Ok(topics.Select(t => ToResponse(t, isChair, me)).ToList());
    }

    /// <summary>
    /// Propose a point of business. Every role the organisation admitted may do
    /// this — the chairman only decides what reaches the agenda.
    /// </summary>
    [HttpPost("topics")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblyTopicResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CreateTopic([FromBody] CreateAssemblyTopicRequest request)
    {
        var error = ValidateTopic(request.Title, request.Description);
        if (error != null) return BadRequest(new { message = error });

        // An ordinary member sends no sitting at all, so the server files the
        // proposal where it belongs: the next open one, or the backlog.
        var targetSessionId = request.SessionId ?? (await NextOpenSessionAsync())?.Id;

        if (targetSessionId is int target)
        {
            var session = await _db.AssemblySessions.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == target);

            if (session is null)
                return BadRequest(new { message = "Tražena sednica ne postoji." });

            if (session.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled)
                return BadRequest(new { message = "Ta sednica je zatvorena — tema se u nju ne može staviti." });
        }

        var topic = new AssemblyTopic
        {
            SessionId = targetSessionId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Status = AssemblyTopicStatus.Proposed,
            ProposedByUserId = CurrentUserId,
            DisplayOrder = await NextDisplayOrderAsync(targetSessionId, AssemblyTopicStatus.Proposed)
        };

        _db.AssemblyTopics.Add(topic);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(AuditActions.AssemblyTopicPropose,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        var dto = await ReloadTopicAsync(topic.Id);
        await NotifyTopicAsync(dto);

        return CreatedAtAction(nameof(GetTopics), null, dto);
    }

    /// <summary>Edit the wording. The proposer while it is unreviewed; the chairman until the ballot.</summary>
    [HttpPut("topics/{id:int}")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblyTopicResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateTopic(int id, [FromBody] UpdateAssemblyTopicRequest request)
    {
        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        var denied = AssemblyTopicRules.WhyCannotEdit(topic, IsChair, CurrentUserId);
        if (denied != null) return BadRequest(new { message = denied });

        var error = ValidateTopic(request.Title, request.Description);
        if (error != null) return BadRequest(new { message = error });

        topic.Title = request.Title.Trim();
        topic.Description = request.Description.Trim();
        topic.UpdatedAt = DateTime.UtcNow;

        _audit.Record(AuditActions.AssemblyTopicUpdate,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        await _db.SaveChangesAsync();

        var dto = await ReloadTopicAsync(id);
        await NotifyTopicAsync(dto);
        return Ok(dto);
    }

    /// <summary>Accept a proposal onto the agenda, or reject it with a reason.</summary>
    [HttpPut("topics/{id:int}/review")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblyTopicResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ReviewTopic(int id, [FromBody] ReviewAssemblyTopicRequest request)
    {
        if (request.Status != AssemblyTopicStatus.Accepted && request.Status != AssemblyTopicStatus.Rejected)
            return BadRequest(new { message = "Tačka se može samo prihvatiti ili odbiti." });

        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        var denied = AssemblyTopicRules.WhyCannotReview(topic);
        if (denied != null) return BadRequest(new { message = denied });

        var wasStatus = topic.Status;
        topic.Status = request.Status;
        topic.ReviewedByUserId = CurrentUserId;
        topic.ReviewedAt = DateTime.UtcNow;
        topic.ReviewNote = Blank(request.Note);
        topic.UpdatedAt = DateTime.UtcNow;

        // Accepting moves the item into a different list, and DisplayOrder is
        // scoped per (sitting, status) — so it needs a position at the end of
        // the list it is arriving in, not the one it left.
        if (wasStatus != request.Status)
            topic.DisplayOrder = await NextDisplayOrderAsync(topic.SessionId, request.Status);

        _audit.Record(
            request.Status == AssemblyTopicStatus.Accepted
                ? AuditActions.AssemblyTopicApprove
                : AuditActions.AssemblyTopicReject,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        await _db.SaveChangesAsync();

        var dto = await ReloadTopicAsync(id);
        await NotifyTopicAsync(dto);
        return Ok(dto);
    }

    /// <summary>Take back your own proposal, while it is still unreviewed.</summary>
    [HttpPut("topics/{id:int}/withdraw")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblyTopicResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> WithdrawTopic(int id)
    {
        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        if (topic.ProposedByUserId != CurrentUserId)
            return BadRequest(new { message = "Možeš povući samo svoj predlog." });

        if (topic.Status != AssemblyTopicStatus.Proposed)
            return BadRequest(new { message = "Povlači se samo predlog o kome još nije odlučeno." });

        topic.Status = AssemblyTopicStatus.Withdrawn;
        topic.UpdatedAt = DateTime.UtcNow;

        _audit.Record(AuditActions.AssemblyTopicWithdraw,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        await _db.SaveChangesAsync();

        var dto = await ReloadTopicAsync(id);
        await NotifyTopicAsync(dto);
        return Ok(dto);
    }

    /// <summary>Move a topic onto a sitting, or back to the backlog.</summary>
    [HttpPut("topics/{id:int}/assign")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblyTopicResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AssignTopic(int id, [FromBody] AssignAssemblyTopicRequest request)
    {
        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        AssemblySession? target = null;
        if (request.SessionId is int wanted)
        {
            target = await _db.AssemblySessions.FindAsync(wanted);
            if (target is null) return BadRequest(new { message = "Tražena sednica ne postoji." });
        }

        var denied = AssemblyTopicRules.WhyCannotAssign(topic, target);
        if (denied != null) return BadRequest(new { message = denied });

        var previousSessionId = topic.SessionId;

        topic.SessionId = request.SessionId;
        // Appended to the end of where it lands rather than keeping a position
        // that means nothing in the new list — the same shape as creating a
        // finance category.
        topic.DisplayOrder = await NextDisplayOrderAsync(request.SessionId, topic.Status);
        topic.UpdatedAt = DateTime.UtcNow;

        _audit.Record(AuditActions.AssemblyTopicAssign,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(),
            $"{topic.Title} → {target?.Title ?? "bekleg"}");

        await _db.SaveChangesAsync();

        var dto = await ReloadTopicAsync(id);

        // The old room must be told the item left, or it keeps rendering a
        // topic that no longer belongs to it.
        if (previousSessionId is int gone && gone != request.SessionId)
            await _notifier.TopicRemovedAsync(gone, id);

        await NotifyTopicAsync(dto);
        return Ok(dto);
    }

    /// <summary>Reorder the agenda by one place.</summary>
    [HttpPut("topics/{id:int}/move")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(IEnumerable<AssemblyTopicResponse>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MoveTopic(int id, [FromBody] MoveAssemblyTopicRequest request)
    {
        if (request.Direction != "up" && request.Direction != "down")
            return BadRequest(new { message = "Pravac mora biti 'up' ili 'down'." });

        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        // Ordering the backlog has no meaning: it is a pile, not an agenda.
        if (topic.SessionId is null)
            return BadRequest(new { message = "Tačka nije u dnevnom redu nijedne sednice." });

        var sessionId = topic.SessionId.Value;   // unwrapped before it reaches SQL
        var session = await _db.AssemblySessions.FindAsync(sessionId);

        var anyVotingStarted = await _db.AssemblyTopics
            .AnyAsync(t => t.SessionId == sessionId && t.VotingStatus != AssemblyVotingStatus.NotOpened);

        var denied = AssemblyTopicRules.WhyCannotReorder(session!, anyVotingStarted);
        if (denied != null) return BadRequest(new { message = denied });

        // Scoped to one sitting AND one status, because that is the pair the
        // agenda screen filters on. Reordering across statuses would swap the
        // last visible row with an invisible rejected one, and the button would
        // look like it did nothing.
        var ordered = await InAgendaOrder(_db.AssemblyTopics
                .Where(t => t.SessionId == sessionId && t.Status == topic.Status))
            .ToListAsync();

        for (var i = 0; i < ordered.Count; i++)
            ordered[i].DisplayOrder = i;

        var index = ordered.FindIndex(t => t.Id == id);
        var targetIndex = request.Direction == "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= ordered.Count)
            return BadRequest(new { message = "Tačka je već na kraju u tom pravcu." });

        (ordered[index].DisplayOrder, ordered[targetIndex].DisplayOrder) =
            (ordered[targetIndex].DisplayOrder, ordered[index].DisplayOrder);

        _audit.Record(
            request.Direction == "up" ? AuditActions.AssemblyTopicMoveUp : AuditActions.AssemblyTopicMoveDown,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        await _db.SaveChangesAsync();

        var agenda = await LoadAgendaAsync(sessionId, topic.Status);
        await _notifier.AgendaReorderedAsync(sessionId, agenda);

        return Ok(agenda);
    }

    /// <summary>Delete a topic. Refused once a ballot has been opened on it.</summary>
    [HttpDelete("topics/{id:int}")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteTopic(int id)
    {
        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        var denied = AssemblyTopicRules.WhyCannotDelete(topic, IsChair, CurrentUserId);
        if (denied != null) return BadRequest(new { message = denied });

        var sessionId = topic.SessionId;

        _audit.Record(AuditActions.AssemblyTopicDelete,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        _db.AssemblyTopics.Remove(topic);
        await _db.SaveChangesAsync();

        if (sessionId is int room)
            await _notifier.TopicRemovedAsync(room, id);

        return Ok(new { message = "Tačka obrisana." });
    }

    // -----------------------------------------------------------------------
    // Ballots
    // -----------------------------------------------------------------------

    /// <summary>Open the floor on one agenda item, or close it.</summary>
    [HttpPut("topics/{id:int}/voting")]
    [Authorize(Roles = Roles.ManageAssembly)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(AssemblyTallyResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> SetVotingStatus(int id, [FromBody] SetVotingStatusRequest request)
    {
        if (request.Status != AssemblyVotingStatus.Open && request.Status != AssemblyVotingStatus.Closed)
            return BadRequest(new { message = "Glasanje se može samo otvoriti ili zatvoriti." });

        var topic = await _db.AssemblyTopics.FindAsync(id);
        if (topic is null) return NotFound();

        if (topic.SessionId is not int sessionId)
            return BadRequest(new { message = "Tačka nije u dnevnom redu nijedne sednice." });

        var session = await _db.AssemblySessions.FindAsync(sessionId);

        if (request.Status == AssemblyVotingStatus.Open)
        {
            var denied = AssemblyTopicRules.WhyCannotOpenVoting(topic, session!);
            if (denied != null) return BadRequest(new { message = denied });

            // A room votes on one thing at a time. Two open ballots would leave
            // the hall unable to say which one its colours belong to.
            var alreadyOpen = await _db.AssemblyTopics
                .AnyAsync(t => t.SessionId == sessionId
                            && t.Id != id
                            && t.VotingStatus == AssemblyVotingStatus.Open);

            if (alreadyOpen)
                return Conflict(new { message = "Glasanje o drugoj tački je već otvoreno. Prvo njega zatvorite." });

            topic.VotingStatus = AssemblyVotingStatus.Open;
            topic.VotingOpenedAt = DateTime.UtcNow;

            // Snapshotted here and never recomputed: roles change, and without
            // this the denominator under every past decision would drift with
            // the membership until "was this vote valid" stopped being answerable.
            topic.EligibleVotersAtOpen = await AssemblyEligibility.Roll(_db).CountAsync();
        }
        else
        {
            var denied = AssemblyTopicRules.WhyCannotCloseVoting(topic);
            if (denied != null) return BadRequest(new { message = denied });

            topic.VotingStatus = AssemblyVotingStatus.Closed;
            topic.VotingClosedAt = DateTime.UtcNow;
        }

        topic.UpdatedAt = DateTime.UtcNow;

        _audit.Record(
            request.Status == AssemblyVotingStatus.Open
                ? AuditActions.AssemblyVotingOpen
                : AuditActions.AssemblyVotingClose,
            AuditEntityTypes.AssemblyTopic, topic.Id.ToString(), topic.Title);

        await _db.SaveChangesAsync();

        var tally = await BuildTallyAsync(id);
        await _notifier.VoteTallyAsync(sessionId, tally);

        // The agenda screen keys its buttons off VotingStatus, so it has to hear
        // about this too — the hall alone is not the whole audience.
        await NotifyTopicAsync(await ReloadTopicAsync(id));

        return Ok(tally);
    }

    /// <summary>The tally on one item, whatever state its ballot is in.</summary>
    [HttpGet("topics/{id:int}/tally")]
    [Authorize(Roles = Roles.ViewPanel)]
    [ProducesResponseType(typeof(AssemblyTallyResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetTally(int id)
    {
        if (!await _db.AssemblyTopics.AnyAsync(t => t.Id == id)) return NotFound();

        return Ok(await BuildTallyAsync(id));
    }

    /// <summary>
    /// Cast a ballot, or change one while the floor is still open.
    /// </summary>
    [HttpPost("topics/{id:int}/votes")]
    [Authorize(Roles = Roles.AssemblyParticipants)]
    [EnableRateLimiting(RateLimitPolicies.AssemblyLive)]
    [ProducesResponseType(typeof(AssemblyTallyResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CastVote(int id, [FromBody] CastAssemblyVoteRequest request)
    {
        if (!AssemblyVoteChoice.IsKnown(request.Choice))
            return BadRequest(new { message = "Nepoznat glas." });

        var userId = CurrentUserId;

        await using var tx = await _db.Database.BeginTransactionAsync();

        // The row is locked for the length of the transaction. Without it a
        // ballot that arrives a millisecond after the chairman's "close" commits
        // slips through: both statements read VotingStatus = open, and both are
        // individually correct.
        var topic = await _db.AssemblyTopics
            .FromSql($@"SELECT * FROM ""AssemblyTopics"" WHERE ""Id"" = {id} FOR UPDATE")
            .FirstOrDefaultAsync();

        if (topic is null) return NotFound();

        var denied = AssemblyTopicRules.WhyCannotVote(topic);
        if (denied != null) return BadRequest(new { message = denied });

        // The token carries a role and lives seven days, so it outlives the
        // membership it was issued against. The roll does not.
        var voter = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Username, u.IsActive, u.Role })
            .FirstAsync();

        if (!AssemblyEligibility.CanTakePart(voter.IsActive, voter.Role))
            return BadRequest(new { message = "Tvoj nalog više nema pravo glasa." });

        var existing = await _db.AssemblyVotes
            .FirstOrDefaultAsync(v => v.TopicId == id && v.UserId == userId);

        if (existing is null)
        {
            _db.AssemblyVotes.Add(new AssemblyVote
            {
                TopicId = id,
                UserId = userId,
                VoterUsername = voter.Username,
                Choice = request.Choice,
                CastAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Choice = request.Choice;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();
        // Nothing has been broadcast above this line: a frame must never
        // announce state that the transaction under it could still roll back.

        var tally = await BuildTallyAsync(id);

        if (topic.SessionId is int sessionId)
            await _notifier.VoteTallyAsync(sessionId, tally);

        return Ok(tally);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// <summary>
    /// Counts the ballots on one item. Nothing here is stored: the outcome, the
    /// quorum and every count are summed from the rows each time they are asked
    /// for, so the verdict can never drift away from the ballots behind it.
    /// </summary>
    private async Task<AssemblyTallyResponse> BuildTallyAsync(int topicId)
    {
        var topic = await _db.AssemblyTopics.AsNoTracking()
            .Include(t => t.Session)
            .FirstAsync(t => t.Id == topicId);

        var votes = await _db.AssemblyVotes.AsNoTracking()
            .Where(v => v.TopicId == topicId)
            .Select(v => new AssemblyVoteMarkResponse(v.UserId, v.Choice))
            .ToListAsync();

        var forCount = votes.Count(v => v.Choice == AssemblyVoteChoice.For);
        var againstCount = votes.Count(v => v.Choice == AssemblyVoteChoice.Against);
        var abstained = votes.Count(v => v.Choice == AssemblyVoteChoice.Abstained);

        // The roll as it stood when the floor opened, so a role handed out
        // mid-sitting cannot change the denominator under a vote in progress.
        // Before that, the roll as it stands now.
        var eligible = topic.VotingStatus == AssemblyVotingStatus.NotOpened
            ? await AssemblyEligibility.Roll(_db).CountAsync()
            : topic.EligibleVotersAtOpen;

        var quorum = topic.Session?.QuorumRequired;

        var outcome = topic.VotingStatus switch
        {
            AssemblyVotingStatus.NotOpened => AssemblyOutcome.NotOpened,
            AssemblyVotingStatus.Open => AssemblyOutcome.Pending,

            // Simple majority of the ballots actually cast. Abstentions are
            // counted and shown but do not sink a proposal — abstaining is
            // standing aside, not voting against.
            _ => forCount > againstCount ? AssemblyOutcome.Passed : AssemblyOutcome.Failed
        };

        return new AssemblyTallyResponse(
            topic.Id,
            topic.Title,
            topic.VotingStatus,
            forCount,
            againstCount,
            abstained,
            Math.Max(0, eligible - votes.Count),
            eligible,
            quorum,
            // Shown as information, never enforced: whether a sitting was
            // quorate is the association's call, not the software's.
            quorum is null || votes.Count >= quorum,
            outcome,
            votes);
    }

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

    /// <summary>
    /// The one ordering the agenda uses. Written once because the list endpoint
    /// and the move endpoint must agree byte for byte: if they sort differently
    /// the server swaps <em>its</em> positions three and four while the chairman
    /// clicked <em>his</em>, and the arrow moves the wrong row — intermittently,
    /// only when DisplayOrder has duplicates.
    /// </summary>
    private static IOrderedQueryable<AssemblyTopic> InAgendaOrder(IQueryable<AssemblyTopic> query) =>
        query.OrderBy(t => t.DisplayOrder).ThenBy(t => t.Id);

    /// <summary>
    /// The sitting a fresh proposal belongs to: the one under way, else the
    /// soonest one scheduled. Null when nothing is on the calendar, which sends
    /// the proposal to the backlog.
    /// </summary>
    private async Task<AssemblySession?> NextOpenSessionAsync()
    {
        var open = await _db.AssemblySessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Status == AssemblySessionStatus.InProgress);

        if (open != null) return open;

        return await _db.AssemblySessions.AsNoTracking()
            .Where(s => s.Status == AssemblySessionStatus.Scheduled)
            .OrderBy(s => s.ScheduledAt)
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// End of the list a topic is arriving in. DisplayOrder is scoped per
    /// (sitting, status), so every move across either boundary needs a new one.
    /// </summary>
    private async Task<int> NextDisplayOrderAsync(int? sessionId, string status)
    {
        var max = await _db.AssemblyTopics
            .Where(t => t.SessionId == sessionId && t.Status == status)
            .Select(t => (int?)t.DisplayOrder)
            .MaxAsync();

        return (max ?? -1) + 1;
    }

    private async Task<AssemblyTopicResponse> ReloadTopicAsync(int id)
    {
        var topic = await _db.AssemblyTopics.AsNoTracking()
            .Include(t => t.Session)
            .Include(t => t.ProposedByUser)
            .Include(t => t.ReviewedByUser)
            .FirstAsync(t => t.Id == id);

        return ToResponse(topic, IsChair, CurrentUserId);
    }

    private async Task<IReadOnlyList<AssemblyTopicResponse>> LoadAgendaAsync(int sessionId, string status)
    {
        var topics = await InAgendaOrder(_db.AssemblyTopics.AsNoTracking()
                .Include(t => t.Session)
                .Include(t => t.ProposedByUser)
                .Include(t => t.ReviewedByUser)
                .Where(t => t.SessionId == sessionId && t.Status == status))
            .ToListAsync();

        return topics.Select(t => ToResponse(t, IsChair, CurrentUserId)).ToList();
    }

    /// <summary>
    /// Pushes a topic to the room it belongs to. A backlog item has no room, so
    /// there is nobody to tell — the agenda screen picks it up on its next load.
    /// </summary>
    private Task NotifyTopicAsync(AssemblyTopicResponse topic) =>
        topic.SessionId is int room
            ? _notifier.TopicChangedAsync(room, topic)
            : Task.CompletedTask;

    private static string? ValidateTopic(string? title, string? description)
    {
        if (string.IsNullOrWhiteSpace(title))
            return "Naslov teme je obavezan.";

        if (title.Trim().Length > MaxTitleLength)
            return $"Naslov teme ne sme biti duži od {MaxTitleLength} znakova.";

        if (string.IsNullOrWhiteSpace(description))
            return "Opis teme je obavezan — iz njega ostali vide o čemu se glasa.";

        return null;
    }

    private static AssemblyTopicResponse ToResponse(AssemblyTopic t, bool isChair, int currentUserId) =>
        new(
            t.Id,
            t.SessionId,
            t.Session?.Title,
            t.Title,
            t.Description,
            t.Status,
            t.ProposedByUserId,
            t.ProposedByUser?.Username ?? "?",
            t.ReviewedByUser?.Username,
            t.ReviewedAt,
            t.ReviewNote,
            t.DisplayOrder,
            t.VotingStatus,
            t.CreatedAt,
            t.UpdatedAt,
            AssemblyTopicRules.WhyCannotEdit(t, isChair, currentUserId) is null,
            AssemblyTopicRules.WhyCannotDelete(t, isChair, currentUserId) is null);

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
