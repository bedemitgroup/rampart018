using System.Text.Json;
using System.Text.Json.Nodes;
using BedemApi.Data;
using BedemApi.Models;

namespace BedemApi.Services;

public class HoneypotGuard : IHoneypotGuard
{
    private const int MaxPayloadLength = 4000;
    private const int MaxUserAgentLength = 512;
    private const int MaxHoneypotValueLength = 512;

    private static readonly string[] SensitiveFragments =
        { "password", "token", "secret" };

    private readonly AppDbContext _db;
    private readonly IClientIpResolver _ipResolver;
    private readonly ILogger<HoneypotGuard> _logger;

    public HoneypotGuard(
        AppDbContext db,
        IClientIpResolver ipResolver,
        ILogger<HoneypotGuard> logger)
    {
        _db = db;
        _ipResolver = ipResolver;
        _logger = logger;
    }

    public async Task<bool> IsBotAsync(
        HttpContext context,
        string form,
        string? honeypotValue,
        object payload,
        int? userId = null)
    {
        // A human never sees the field, so anything in it is a bot filling in
        // every input it found.
        if (string.IsNullOrWhiteSpace(honeypotValue))
            return false;

        var ip = _ipResolver.Resolve(context);

        // Recording the attempt must never change the outcome. If the write
        // fails we still reject, otherwise a broken table would quietly turn
        // the honeypot off — and an exception here would surface as a 500,
        // telling the bot it found something.
        try
        {
            _db.BotSubmissions.Add(new BotSubmission
            {
                Form = form,
                IpAddress = ip,
                UserAgent = Truncate(
                    context.Request.Headers.UserAgent.ToString(),
                    MaxUserAgentLength),
                UserId = userId,
                HoneypotValue = Truncate(honeypotValue, MaxHoneypotValueLength),
                Payload = SerializeRedacted(payload)
            });

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Could not record a honeypot hit on {Form} from {Ip}.",
                form,
                ip ?? "unknown");
        }

        _logger.LogWarning(
            "Honeypot tripped on {Form} from {Ip}; submission discarded.",
            form,
            ip ?? "unknown");

        return true;
    }

    /// <summary>
    /// Serializes the request body for storage, blanking anything that looks
    /// like a credential. RegisterRequest carries a plaintext password, so this
    /// is a matching rule rather than a hand-maintained exclusion list — a DTO
    /// gaining a sensitive field later is redacted without anyone remembering.
    /// </summary>
    private string? SerializeRedacted(object payload)
    {
        try
        {
            var node = JsonSerializer.SerializeToNode(payload);
            Redact(node);

            return Truncate(node?.ToJsonString(), MaxPayloadLength);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Could not serialize a honeypot payload.");
            return null;
        }
    }

    private static void Redact(JsonNode? node)
    {
        switch (node)
        {
            case JsonObject obj:
                // Materialize the keys first; assigning while enumerating throws.
                foreach (var key in obj.Select(property => property.Key).ToList())
                {
                    if (IsSensitive(key))
                        obj[key] = "[REDACTED]";
                    else
                        Redact(obj[key]);
                }
                break;

            case JsonArray array:
                foreach (var item in array)
                    Redact(item);
                break;
        }
    }

    private static bool IsSensitive(string propertyName) =>
        SensitiveFragments.Any(fragment =>
            propertyName.Contains(fragment, StringComparison.OrdinalIgnoreCase));

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
            return null;

        return value.Length <= maxLength
            ? value
            : value[..maxLength];
    }
}
