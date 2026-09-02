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
// Live payloads (SignalR)
// ---------------------------------------------------------------------------

public record AssemblyPresenceResponse(int UserId, string Username, string Role);
