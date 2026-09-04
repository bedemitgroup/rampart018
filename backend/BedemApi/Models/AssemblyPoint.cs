namespace BedemApi.Models;

/// <summary>
/// What one member earned at one sitting: +1 for turning up, -1 for not.
/// </summary>
/// <remarks>
/// <para>
/// Written when the chairman closes the sitting, and never recomputed. It could
/// be summed from the attendance rows on every read, but that would make the
/// standings quietly rewrite themselves: the scoring rule will change one day,
/// and the roll itself is correctable while a sitting runs. What this table
/// holds is what was actually awarded, on the day.
/// </para>
/// <para>
/// Same reasoning as <see cref="AssemblyVote.VoterUsername"/> and the
/// denormalised actor on <c>AuditLog</c> — a record has to keep saying what it
/// said.
/// </para>
/// </remarks>
public class AssemblyPoint
{
    public int Id { get; set; }

    public int SessionId { get; set; }
    public AssemblySession Session { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>The member's name as it stood when the sitting closed.</summary>
    public string MemberUsername { get; set; } = string.Empty;

    /// <summary>Whether he was on the floor — in the room or on the call.</summary>
    public bool Attended { get; set; }

    /// <summary>One of <see cref="AssemblyCheckInMode"/>; null when he was absent.</summary>
    public string? Mode { get; set; }

    /// <summary>
    /// The score itself, stored rather than derived from <see cref="Attended"/>,
    /// so changing the rule later cannot reach back and re-judge a sitting that
    /// has already been held.
    /// </summary>
    public int Points { get; set; }

    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
}
