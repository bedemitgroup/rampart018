namespace BedemApi.DTOs;

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/// <summary>
/// ScheduledAt is a DateTimeOffset, not a DateTime, on purpose. The client
/// sends an ISO-8601 instant (Date.toISOString()), so the server never has to
/// guess a zone, and the value converts to Kind=Utc by construction — which is
/// the only thing Npgsql will write to a timestamptz column.
/// </summary>
public record CreateAssemblySessionRequest(
    string Title,
    DateTimeOffset ScheduledAt,
    string? Location,
    string? OnlineUrl,
    string? Description,
    int? QuorumRequired);

public record UpdateAssemblySessionRequest(
    string Title,
    DateTimeOffset ScheduledAt,
    string? Location,
    string? OnlineUrl,
    string? Description,
    int? QuorumRequired);

/// <summary>Status is one of AssemblySessionStatus.</summary>
public record SetAssemblySessionStatusRequest(string Status);

public record AssemblySessionResponse(
    int Id,
    string Title,
    DateTime ScheduledAt,
    string? Location,
    string? OnlineUrl,
    string? Description,
    string Status,
    int? QuorumRequired,
    string CreatedByUsername,
    DateTime? OpenedAt,
    DateTime? ClosedAt,
    DateTime CreatedAt,
    int TopicCount,
    AssemblyRsvpCountsResponse Rsvp,
    string? MyResponse
);

public record AssemblyRsvpCountsResponse(
    int Attending,
    int Online,
    int Unsure,
    int Absent,
    int NoAnswer
);

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

public record SetRsvpRequest(string Response, string? Note);

/// <summary>Mode is one of AssemblyCheckInMode. Null clears the check-in.</summary>
public record CheckInRequest(string? Mode);

// ---------------------------------------------------------------------------
// The hall
// ---------------------------------------------------------------------------

/// <summary>
/// One seat. Carries all three layers from the start — what he answered
/// (Response), whether he actually turned up (CheckedInAt / CheckInMode), and
/// whether he is connected right now (IsLive) — because they are orthogonal and
/// bolting the third onto a finished grid is where the layout gets ugly.
///
/// IsLive never comes from the database: the REST response reports it as false
/// and the live socket corrects it within a second. Email is deliberately
/// absent — every member reads this endpoint.
/// </summary>
public record AssemblySeatResponse(
    int UserId,
    string Username,
    string Role,
    string? Response,
    DateTime? CheckedInAt,
    string? CheckInMode,
    bool IsLive
);

public record AssemblyHallResponse(
    AssemblySessionResponse Session,
    IReadOnlyList<AssemblySeatResponse> Seats,
    int EligibleCount,
    int CheckedInCount
);

// ---------------------------------------------------------------------------
// Agenda topics
// ---------------------------------------------------------------------------

/// <summary>
/// SessionId is optional. Left null - which is what an ordinary member always
/// sends - the server files the proposal against the next open sitting, or into
/// the backlog when none is scheduled. Choosing a sitting by hand is the
/// chairman's job, and he has the assign endpoint for it.
/// </summary>
public record CreateAssemblyTopicRequest(string Title, string Description, int? SessionId);

public record UpdateAssemblyTopicRequest(string Title, string Description);

/// <summary>Status is Prihvacena or Odbijena; Note is the reason, shown back to the proposer.</summary>
public record ReviewAssemblyTopicRequest(string Status, string? Note);

/// <summary>Null SessionId sends the topic back to the backlog.</summary>
public record AssignAssemblyTopicRequest(int? SessionId);

public record MoveAssemblyTopicRequest(string Direction);

/// <summary>
/// CanEdit and CanDelete are answered by the server rather than re-derived in
/// the browser: the rules depend on who is asking, on the topic's status and on
/// whether a ballot has been opened, and a second copy of that in JSX would be
/// a second copy that can be wrong.
/// </summary>
public record AssemblyTopicResponse(
    int Id,
    int? SessionId,
    string? SessionTitle,
    string Title,
    string Description,
    string Status,
    int ProposedByUserId,
    string ProposedByUsername,
    string? ReviewedByUsername,
    DateTime? ReviewedAt,
    string? ReviewNote,
    int DisplayOrder,
    string VotingStatus,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    bool CanEdit,
    bool CanDelete
);

// ---------------------------------------------------------------------------
// Live payloads (SignalR)
// ---------------------------------------------------------------------------

public record AssemblyPresenceResponse(int UserId, string Username, string Role);
