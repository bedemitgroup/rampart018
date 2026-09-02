namespace BedemApi.Models;

/// <summary>
/// One member's ballot on one topic. Votes are public per member by design —
/// the hall shows who voted which way — so this table is a roll call, not a
/// tally.
/// </summary>
/// <remarks>
/// <see cref="VoterUsername"/> is denormalised for the same reason
/// <c>AuditLog</c> stores <c>ActorUsername</c>: a roll call must keep saying
/// what it said. Reading the name through the FK would silently rewrite every
/// past vote the moment someone is renamed.
/// </remarks>
public class AssemblyVote
{
    public int Id { get; set; }

    public int TopicId { get; set; }
    public AssemblyTopic Topic { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>The voter's name as it stood when the ballot was cast.</summary>
    public string VoterUsername { get; set; } = string.Empty;

    /// <summary>One of <see cref="AssemblyVoteChoice"/>.</summary>
    public string Choice { get; set; } = string.Empty;

    public DateTime CastAt { get; set; } = DateTime.UtcNow;

    /// <summary>Set when a member changes his mind while the ballot is open.</summary>
    public DateTime? UpdatedAt { get; set; }
}
