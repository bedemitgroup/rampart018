namespace BedemApi.Services;

/// <summary>How to pick the client entry out of an X-Forwarded-For chain.</summary>
public enum ForwardedForStrategy
{
    /// <summary>
    /// Take the leftmost entry. Spoofable: a client that sends its own
    /// X-Forwarded-For gets that value preserved to the left of the address
    /// the edge proxy appends. Only use where the proxy is known to replace
    /// the header rather than append to it.
    /// </summary>
    Leftmost,

    /// <summary>
    /// Take the entry <see cref="ClientIpOptions.TrustedProxyHops"/> from the
    /// right, i.e. the last one written by our own infrastructure. Not
    /// spoofable, because a client cannot append to the header. Default.
    /// </summary>
    RightmostFromTrustedHops
}

/// <summary>
/// Configuration for <see cref="ClientIpResolver"/>. Bound from the
/// "ClientIp" configuration section.
/// </summary>
public sealed class ClientIpOptions
{
    public const string SectionName = "ClientIp";

    /// <summary>
    /// Single-value header that the edge proxy overwrites on every request, so
    /// it can be trusted as-is. Checked before X-Forwarded-For. Leave empty
    /// when there is no such header (local development, Render).
    /// Fly.io: "Fly-Client-IP". Railway: "X-Envoy-External-Address".
    /// </summary>
    public string? ProviderHeader { get; set; }

    /// <summary>Which X-Forwarded-For entry holds the client address.</summary>
    public ForwardedForStrategy Strategy { get; set; } =
        ForwardedForStrategy.RightmostFromTrustedHops;

    /// <summary>
    /// Number of proxies between the public internet and this app. Each one
    /// appends an entry to X-Forwarded-For, so this is how far from the right
    /// the real client address sits. Ignored when
    /// <see cref="Strategy"/> is <see cref="ForwardedForStrategy.Leftmost"/>.
    /// </summary>
    public int TrustedProxyHops { get; set; } = 1;
}
