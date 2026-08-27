using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace BedemApi.Services;

public static class RateLimitingSetup
{
    /// <summary>
    /// Carries the rejecting policy's window from the partitioner to
    /// <see cref="OnRejected"/>. SlidingWindowRateLimiter lists RETRY_AFTER in
    /// its metadata names but never populates it (only the fixed-window
    /// limiter does), so the value has to come from the rule itself.
    /// </summary>
    private const string RetryAfterItemKey = "__BedemRateLimitWindow";

    /// <summary>
    /// Registers one sliding-window policy per entry in
    /// <see cref="RateLimitPolicies.All"/>, each partitioned by the address
    /// from <see cref="IClientIpResolver"/>.
    /// </summary>
    public static IServiceCollection AddBedemRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var section = configuration.GetSection(RateLimitOptions.SectionName);
        services.Configure<RateLimitOptions>(section);

        var options = section.Get<RateLimitOptions>() ?? new RateLimitOptions();

        // A typo in a policy name would otherwise silently leave an endpoint
        // unlimited, so fail loudly at startup instead.
        Validate(options);

        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            foreach (var policyName in RateLimitPolicies.All)
            {
                var rule = options.Policies[policyName];

                limiter.AddPolicy(policyName, httpContext =>
                    RateLimitPartition.GetSlidingWindowLimiter(
                        BuildPartitionKey(httpContext, policyName, rule),
                        _ => new SlidingWindowRateLimiterOptions
                        {
                            PermitLimit = rule.PermitLimit,
                            Window = rule.Window,
                            SegmentsPerWindow = rule.SegmentsPerWindow,
                            // Reject immediately; queueing a spammer just
                            // holds the connection open.
                            QueueLimit = 0,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            AutoReplenishment = true
                        }));
            }

            limiter.OnRejected = OnRejected;
        });

        return services;
    }

    private static string BuildPartitionKey(
        HttpContext httpContext,
        string policyName,
        RateLimitRule rule)
    {
        // Runs for every request through this policy, including the ones about
        // to be rejected, so OnRejected can read it back.
        httpContext.Items[RetryAfterItemKey] = rule.Window;

        if (rule.PartitionBy == RateLimitPartitionBy.UserThenIp)
        {
            var userId = httpContext.User.FindFirstValue("userId");
            if (!string.IsNullOrEmpty(userId))
                return $"{policyName}|user:{userId}";
        }

        var resolver = httpContext.RequestServices
            .GetRequiredService<IClientIpResolver>();

        var ip = resolver.Resolve(httpContext);

        if (ip == null)
        {
            // Should not happen behind a real proxy. Sharing one bucket fails
            // closed: it can only over-restrict, never let a caller through.
            httpContext.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger(typeof(RateLimitingSetup))
                .LogWarning(
                    "Could not resolve a client address for {Path}; " +
                    "falling back to the shared rate-limit bucket.",
                    httpContext.Request.Path);

            return $"{policyName}|unknown";
        }

        return $"{policyName}|ip:{ip}";
    }

    private static ValueTask OnRejected(
        OnRejectedContext context,
        CancellationToken cancellationToken)
    {
        var response = context.HttpContext.Response;
        response.StatusCode = StatusCodes.Status429TooManyRequests;

        int? retryAfterSeconds = null;

        // The full window, not one segment: a caller who burned the whole
        // budget in a burst really does have to wait for it to slide off, and
        // a shorter hint would just have them retry into another 429.
        if (context.HttpContext.Items[RetryAfterItemKey] is TimeSpan window &&
            window > TimeSpan.Zero)
        {
            retryAfterSeconds = (int)Math.Ceiling(window.TotalSeconds);

            response.Headers.RetryAfter =
                retryAfterSeconds.Value.ToString(CultureInfo.InvariantCulture);
        }

        context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(RateLimitingSetup))
            .LogWarning(
                "Rate limit hit for {Method} {Path}.",
                context.HttpContext.Request.Method,
                context.HttpContext.Request.Path);

        return new ValueTask(response.WriteAsJsonAsync(
            new
            {
                message =
                    "Poslali ste previše zahteva. Sačekajte malo pa pokušajte ponovo.",
                retryAfterSeconds
            },
            cancellationToken));
    }

    private static void Validate(RateLimitOptions options)
    {
        var missing = RateLimitPolicies.All
            .Where(name => !options.Policies.ContainsKey(name))
            .ToList();

        if (missing.Count > 0)
        {
            throw new InvalidOperationException(
                $"Missing '{RateLimitOptions.SectionName}:Policies' entries for: " +
                string.Join(", ", missing));
        }

        foreach (var (name, rule) in options.Policies)
        {
            if (rule.PermitLimit <= 0)
            {
                throw new InvalidOperationException(
                    $"Rate limit policy '{name}' has PermitLimit {rule.PermitLimit}; " +
                    "it must be greater than zero.");
            }

            if (rule.Window <= TimeSpan.Zero)
            {
                throw new InvalidOperationException(
                    $"Rate limit policy '{name}' has Window {rule.Window}; " +
                    "it must be greater than zero.");
            }

            if (rule.SegmentsPerWindow <= 0)
            {
                throw new InvalidOperationException(
                    $"Rate limit policy '{name}' has SegmentsPerWindow " +
                    $"{rule.SegmentsPerWindow}; it must be greater than zero.");
            }
        }
    }
}
