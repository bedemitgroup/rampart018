namespace BedemApi.Models;

/// <summary>
/// A submission that tripped the honeypot field, kept as evidence. Deliberately
/// has no foreign key to <see cref="User"/>: deleting an account must not delete
/// the record of what it did.
/// </summary>
public class BotSubmission
{
    public int Id { get; set; }

    /// <summary>Which form was submitted, e.g. "comments" or "register".</summary>
    public string Form { get; set; } = string.Empty;

    /// <summary>Resolved through IClientIpResolver, so it is the real client address behind the proxy.</summary>
    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    /// <summary>Only set for forms behind a login; null for the anonymous ones.</summary>
    public int? UserId { get; set; }

    /// <summary>What was typed into the hidden field.</summary>
    public string? HoneypotValue { get; set; }

    /// <summary>The whole submitted body as JSON, with credentials redacted.</summary>
    public string? Payload { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
