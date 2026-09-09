namespace BedemApi.Services;

/// <summary>
/// Records who did what. Both methods read the actor and the client address off
/// the current request, so callers pass only what they are acting on.
/// </summary>
public interface IAuditLogger
{
    /// <summary>
    /// Queues an audit row on the DbContext without saving. The caller's own
    /// <c>SaveChangesAsync</c> commits both, so the change and its trail land in
    /// one transaction: no trail for a write that failed, and no silent write
    /// without a trail.
    /// </summary>
    void Record(string action, string entityType, string? entityId = null, string? entityLabel = null);

    /// <summary>
    /// Queues an audit row and saves immediately. For creates, where the new
    /// row's id only exists after the first save.
    /// </summary>
    Task RecordAsync(string action, string entityType, string? entityId = null, string? entityLabel = null);
}
