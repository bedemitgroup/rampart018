namespace BedemApi.Models;

/// <summary>
/// One recorded action by a moderator or admin. Append-only: nothing in the API
/// updates or deletes these rows, because a trail that can be edited is not a
/// trail.
/// </summary>
/// <remarks>
/// Deliberately has no foreign key to <see cref="User"/>, for the same reason
/// <see cref="BotSubmission"/> does not: deleting an account must not delete the
/// record of what that account did. The actor's name and role are snapshotted
/// instead, so the log stays readable — and keeps saying "Moderator" for an
/// action taken before a promotion.
/// </remarks>
public class AuditLog
{
    public int Id { get; set; }

    public int? ActorUserId { get; set; }

    /// <summary>Username as it stood when the action was taken.</summary>
    public string ActorUsername { get; set; } = string.Empty;

    /// <summary>Role as it stood when the action was taken.</summary>
    public string ActorRole { get; set; } = string.Empty;

    /// <summary>One of <see cref="AuditActions"/>. Stable English constant; the UI translates it.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>One of <see cref="AuditEntityTypes"/>. Drives the entity filter.</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>A string, so slugs and composite keys ("2026/3") fit alongside plain ids.</summary>
    public string? EntityId { get; set; }

    /// <summary>
    /// Human-readable name of what was acted on. Copied rather than looked up,
    /// so the row still reads properly once the target is deleted.
    /// </summary>
    public string? EntityLabel { get; set; }

    /// <summary>Resolved through IClientIpResolver, so it is the real address behind the proxy.</summary>
    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
