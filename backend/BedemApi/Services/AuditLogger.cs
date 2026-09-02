using System.Security.Claims;
using BedemApi.Data;
using BedemApi.Models;

namespace BedemApi.Services;

/// <inheritdoc />
public sealed class AuditLogger : IAuditLogger
{
    private const int MaxUserAgentLength = 512;

    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IClientIpResolver _ipResolver;

    public AuditLogger(
        AppDbContext db,
        IHttpContextAccessor httpContextAccessor,
        IClientIpResolver ipResolver)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _ipResolver = ipResolver;
    }

    public void Record(string action, string entityType, string? entityId = null, string? entityLabel = null)
    {
        _db.AuditLogs.Add(Build(action, entityType, entityId, entityLabel));
    }

    public async Task RecordAsync(string action, string entityType, string? entityId = null, string? entityLabel = null)
    {
        Record(action, entityType, entityId, entityLabel);
        await _db.SaveChangesAsync();
    }

    private AuditLog Build(string action, string entityType, string? entityId, string? entityLabel)
    {
        var context = _httpContextAccessor.HttpContext;
        var user = context?.User;

        // Every audited endpoint sits behind [Authorize], so these claims are
        // present in practice. They are still read defensively: a half-filled
        // row is worth more than a lost one.
        var actorId = int.TryParse(user?.FindFirstValue("userId"), out var parsed)
            ? parsed
            : (int?)null;

        var userAgent = context?.Request.Headers.UserAgent.ToString();

        return new AuditLog
        {
            ActorUserId = actorId,
            ActorUsername = user?.FindFirstValue("username") ?? "?",
            ActorRole = user?.FindFirstValue(ClaimTypes.Role) ?? "?",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            EntityLabel = Truncate(entityLabel, 200),
            IpAddress = context == null ? null : _ipResolver.Resolve(context),
            UserAgent = Truncate(string.IsNullOrWhiteSpace(userAgent) ? null : userAgent, MaxUserAgentLength)
        };
    }

    private static string? Truncate(string? value, int maxLength) =>
        value == null || value.Length <= maxLength ? value : value[..maxLength];
}
