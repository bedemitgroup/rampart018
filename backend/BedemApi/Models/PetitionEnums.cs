namespace BedemApi.Models;

/// <summary>
/// Where a petition is in its life. Stored as text in the Serbian wording the
/// panel shows, the same way <see cref="AssemblySessionStatus"/> does — the
/// value in the database is the value on screen.
///
/// <see cref="Archived"/> is not a fourth kind of "closed": it means the
/// signatures are gone. A petition reaches it when the retention period runs
/// out, and from there only the number survives.
/// </summary>
public static class PetitionStatus
{
    /// <summary>Being written. Invisible to anyone outside the panel.</summary>
    public const string Draft = "Nacrt";

    /// <summary>Published and collecting signatures.</summary>
    public const string Open = "Otvorena";

    /// <summary>Published, readable, but no longer signable.</summary>
    public const string Closed = "Zatvorena";

    /// <summary>Closed and the signatures deleted. Only the count remains.</summary>
    public const string Archived = "Arhivirana";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Draft, Open, Closed, Archived
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);

    /// <summary>Statuses anybody may see without being let into the panel.</summary>
    public static bool IsPublic(string value) =>
        value is Open or Closed or Archived;
}
