namespace BedemApi.Models;

/// <summary>
/// The one line of "aktuelno" that runs across the top of the front page — the
/// next public action, a deadline, whatever is current this week.
/// </summary>
/// <remarks>
/// One row, seeded with <c>Id = 1</c>, the same shape as <see cref="AssemblySettings"/>:
/// the site has exactly one such line, and seeding means no endpoint has to
/// answer "what if there is no row yet". A Moderator edits the text from the
/// news panel; everyone else just reads it.
/// </remarks>
public class SiteNotice
{
    /// <summary>Always 1. There is one front page and one notice line.</summary>
    public int Id { get; set; }

    public string Text { get; set; } = string.Empty;

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
}
