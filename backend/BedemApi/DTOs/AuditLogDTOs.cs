namespace BedemApi.DTOs;

public record AuditLogResponse(
    int Id,
    int? ActorUserId,
    string ActorUsername,
    string ActorRole,
    string Action,
    string EntityType,
    string? EntityId,
    string? EntityLabel,
    string? IpAddress,
    DateTime CreatedAt
);

/// <summary>
/// One page of the log. The total is what drives the pager on the admin page —
/// the client never holds the whole trail.
/// </summary>
public record AuditLogPageResponse(
    IReadOnlyList<AuditLogResponse> Items,
    int Total,
    int Page,
    int PageSize
);

/// <summary>
/// The values actually present in the log, for populating the filter dropdowns
/// without fetching every row.
/// </summary>
public record AuditLogFiltersResponse(
    IReadOnlyList<AuditLogActorResponse> Actors,
    IReadOnlyList<string> EntityTypes,
    IReadOnlyList<string> Actions
);

public record AuditLogActorResponse(int? UserId, string Username);
