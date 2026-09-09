namespace BedemApi.Models;

/// <summary>
/// How this association decides: the quorum it needs to sit, and the majority a
/// proposal needs to pass.
/// </summary>
/// <remarks>
/// <para>
/// One row, seeded with <c>Id = 1</c>, because these are the association's rules
/// and it has exactly one set of them. Seeding rather than creating on demand
/// means no endpoint ever has to answer "what if there is no row yet".
/// </para>
/// <para>
/// Configurable rather than written into the code because that is what the law
/// actually says. The Zakon o udruženjima fixes neither figure: article 22 says
/// only that the assembly is the highest body and comprises all members, and
/// article 12 requires the <em>statute</em> to lay down "način odlučivanja".
/// Every association writes its own, so the software's job is to hold whatever
/// this one wrote, not to invent a rule for it.
/// </para>
/// </remarks>
public class AssemblySettings
{
    /// <summary>Always 1. There is one association and one set of rules.</summary>
    public int Id { get; set; }

    /// <summary>
    /// The share of the roll that must have checked in for the sitting to decide
    /// validly. Compared with a strict "more than", so 50 means the usual
    /// "prisutna više od polovine članova" rather than exactly half.
    /// </summary>
    public int QuorumPercent { get; set; } = 50;

    /// <summary>One of <see cref="AssemblyMajorityRule"/>.</summary>
    public string MajorityRule { get; set; } = AssemblyMajorityRule.OfVotesCast;

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
}
