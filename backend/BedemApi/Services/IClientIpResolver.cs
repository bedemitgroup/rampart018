namespace BedemApi.Services;

public interface IClientIpResolver
{
    /// <summary>
    /// Resolves the originating client address for a request that reached us
    /// through a managed provider's edge proxy.
    /// </summary>
    /// <returns>
    /// A normalized IP address, or <c>null</c> when no address could be
    /// determined. Callers that use the result as a partition key must handle
    /// <c>null</c> explicitly rather than defaulting it to a shared bucket.
    /// </returns>
    string? Resolve(HttpContext context);
}
