namespace BedemApi.Services;

public interface IHoneypotGuard
{
    /// <summary>
    /// The name of the hidden field, shared with the frontend. Kept here so the
    /// wire name lives in exactly one place on this side.
    /// </summary>
    const string FieldName = "contact_reference";

    /// <summary>
    /// Decides whether a submission came from a bot, and records it if so.
    /// </summary>
    /// <param name="form">Which form this was, stored as-is for later filtering.</param>
    /// <param name="honeypotValue">The hidden field's value from the request body.</param>
    /// <param name="payload">
    /// The full request DTO. Serialized to JSON with credentials redacted, so it
    /// is safe to pass a record containing a password.
    /// </param>
    /// <returns>
    /// <c>true</c> when the honeypot was filled in. Callers must then return a
    /// response indistinguishable from success without writing anything else.
    /// </returns>
    Task<bool> IsBotAsync(
        HttpContext context,
        string form,
        string? honeypotValue,
        object payload,
        int? userId = null);

    /// <summary>
    /// A plausible id for a fake success response. Not zero on purpose: the
    /// problem report page shows the returned id back as a reference number,
    /// so a zero would be visible to anyone caught by mistake.
    /// </summary>
    static int FakeId() => Random.Shared.Next(1000, 9999);
}
