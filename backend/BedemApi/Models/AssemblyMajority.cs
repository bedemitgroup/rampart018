namespace BedemApi.Models;

/// <summary>
/// The arithmetic of a decision, in one place.
///
/// Returns both halves of the answer — whether it passed, and how many votes in
/// favour it would have taken — because the room needs to be told the threshold
/// while a ballot is still open, not only the verdict once it closes.
/// </summary>
public static class AssemblyMajority
{
    /// <param name="rule">One of <see cref="AssemblyMajorityRule"/>.</param>
    /// <param name="forCount">Votes in favour.</param>
    /// <param name="againstCount">Votes against.</param>
    /// <param name="present">Members checked in at the sitting.</param>
    /// <param name="eligible">The whole roll.</param>
    /// <returns>How many votes in favour the proposal needs to carry.</returns>
    public static int RequiredFor(string rule, int againstCount, int present, int eligible) => rule switch
    {
        // More of the ballots cast said yes than said no. Abstaining is standing
        // aside: it is counted and shown, but it neither helps nor hinders.
        AssemblyMajorityRule.OfVotesCast => againstCount + 1,

        // More than half of everyone who turned up. Here abstaining does work
        // against a proposal, because the abstainer stays in the denominator.
        AssemblyMajorityRule.OfPresent => present / 2 + 1,

        // More than half of the entire membership, whoever bothered to come.
        AssemblyMajorityRule.OfAllMembers => eligible / 2 + 1,

        _ => againstCount + 1
    };

    public static bool Passes(string rule, int forCount, int againstCount, int present, int eligible) =>
        forCount > 0 && forCount >= RequiredFor(rule, againstCount, present, eligible);

    /// <summary>
    /// How many must have checked in for the sitting to decide validly. A strict
    /// "more than" of the configured share, so the usual 50 means more than half
    /// rather than exactly half.
    /// </summary>
    public static int QuorumThreshold(int quorumPercent, int eligible) =>
        eligible == 0 ? 0 : eligible * quorumPercent / 100 + 1;

    public static bool HasQuorum(int quorumPercent, int present, int eligible) =>
        present >= QuorumThreshold(quorumPercent, eligible);
}
