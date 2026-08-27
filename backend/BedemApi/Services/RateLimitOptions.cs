namespace BedemApi.Services;

/// <summary>What the request counter is keyed on.</summary>
public enum RateLimitPartitionBy
{
    /// <summary>
    /// Client IP. Correct for anonymous endpoints. Note that visitors behind
    /// carrier-grade NAT (most mobile networks) share one address, so they
    /// share one budget.
    /// </summary>
    Ip,

    /// <summary>
    /// Authenticated user id, falling back to IP for anonymous requests.
    /// Avoids the shared-NAT problem on endpoints that require a login.
    /// </summary>
    UserThenIp
}

public sealed class RateLimitRule
{
    /// <summary>Requests allowed per <see cref="Window"/>, per partition.</summary>
    public int PermitLimit { get; set; }

    /// <summary>Length of the sliding window, e.g. "00:10:00".</summary>
    public TimeSpan Window { get; set; }

    /// <summary>
    /// Sliding-window granularity. Higher is smoother but holds more state;
    /// the default keeps the counter from resetting in one lump.
    /// </summary>
    public int SegmentsPerWindow { get; set; } = 6;

    public RateLimitPartitionBy PartitionBy { get; set; } = RateLimitPartitionBy.Ip;
}

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>
    /// Turns the middleware off entirely. Intended for local development —
    /// leave it on everywhere else.
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Keyed by policy name, see <see cref="RateLimitPolicies"/>.</summary>
    public Dictionary<string, RateLimitRule> Policies { get; set; } = new();
}
