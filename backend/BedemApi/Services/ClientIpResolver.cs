using System.Net;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace BedemApi.Services;

/// <summary>
/// Reads the client address from proxy headers. The app is only reachable
/// through the hosting provider's edge proxy, so the headers are trusted
/// without a KnownProxies/KnownNetworks whitelist — but see
/// <see cref="ForwardedForStrategy"/> for which X-Forwarded-For entry the
/// proxy actually controls.
/// </summary>
public sealed class ClientIpResolver : IClientIpResolver
{
    private const string ForwardedForHeader = "X-Forwarded-For";

    private readonly ClientIpOptions _options;

    public ClientIpResolver(IOptions<ClientIpOptions> options)
    {
        _options = options.Value;
    }

    public string? Resolve(HttpContext context)
    {
        var headers = context.Request.Headers;

        // 1. Provider header, overwritten by the edge on every request.
        if (!string.IsNullOrWhiteSpace(_options.ProviderHeader) &&
            headers.TryGetValue(_options.ProviderHeader, out var providerValues))
        {
            var providerIp = FirstAddress(providerValues);
            if (providerIp != null)
                return providerIp.ToString();
        }

        // 2. X-Forwarded-For chain.
        if (headers.TryGetValue(ForwardedForHeader, out var forwardedValues))
        {
            var forwardedIp = PickFromChain(forwardedValues);
            if (forwardedIp != null)
                return forwardedIp.ToString();
        }

        // 3. Direct connection — local development with no proxy in front.
        var remote = context.Connection.RemoteIpAddress;
        return remote == null ? null : Normalize(remote).ToString();
    }

    private static IPAddress? FirstAddress(StringValues values)
    {
        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            var ip = ParseAddress(value);
            if (ip != null)
                return ip;
        }

        return null;
    }

    private IPAddress? PickFromChain(StringValues values)
    {
        // The header can arrive as several lines, each holding a comma-separated
        // list. Order across lines is preserved, so flatten them into one chain.
        var chain = new List<IPAddress>();

        foreach (var value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            foreach (var entry in value.Split(','))
            {
                var ip = ParseAddress(entry);
                if (ip != null)
                    chain.Add(ip);
            }
        }

        if (chain.Count == 0)
            return null;

        if (_options.Strategy == ForwardedForStrategy.Leftmost)
            return chain[0];

        // Every proxy appends the address it received the request from, so the
        // entry `TrustedProxyHops` from the right is the last one our own edge
        // wrote. Anything left of it came from the client and is forgeable.
        // A chain shorter than the configured hop count means fewer proxies
        // than expected; fall back to the leftmost entry we do have.
        var hops = Math.Max(_options.TrustedProxyHops, 1);
        var index = Math.Max(chain.Count - hops, 0);

        return chain[index];
    }

    private static IPAddress? ParseAddress(ReadOnlySpan<char> raw)
    {
        var value = raw.Trim();

        if (value.IsEmpty)
            return null;

        if (value[0] == '[')
        {
            // "[2001:db8::1]:443" -> "2001:db8::1"
            var close = value.IndexOf(']');
            if (close < 0)
                return null;

            value = value[1..close];
        }
        else
        {
            // "1.2.3.4:443" -> "1.2.3.4". A bare IPv6 literal has more than one
            // colon, so only strip when exactly one is present.
            var colon = value.IndexOf(':');
            if (colon >= 0 && !value[(colon + 1)..].Contains(':'))
                value = value[..colon];
        }

        return IPAddress.TryParse(value, out var ip) ? Normalize(ip) : null;
    }

    /// <summary>
    /// Collapses "::ffff:1.2.3.4" to "1.2.3.4" so the same client yields the
    /// same key whether it arrived over an IPv4 or dual-stack socket.
    /// </summary>
    private static IPAddress Normalize(IPAddress ip) =>
        ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip;
}
