namespace BedemApi.Services;

/// <summary>
/// Policy names shared between configuration and the
/// <c>[EnableRateLimiting]</c> attributes on controller actions. Every name
/// here must have a matching entry in the "RateLimiting:Policies" section —
/// startup fails otherwise.
/// </summary>
public static class RateLimitPolicies
{
    public const string Register = "register";
    public const string Login = "login";
    public const string Comments = "comments";
    public const string ProblemReports = "problem-reports";
    public const string MembershipApplications = "membership-applications";
    public const string Votes = "votes";
    public const string AdminWrites = "admin-writes";

    /// <summary>
    /// Members acting during a live sitting: RSVP, check-in, ballots. Kept off
    /// admin-writes on purpose - a chairman opening and closing fifteen items
    /// in two minutes would eat that budget, and a 429 mid-session is the worst
    /// possible moment for one.
    /// </summary>
    public const string AssemblyLive = "assembly-live";

    /// <summary>
    /// Signing a petition. Tighter than votes because the ceiling is not a
    /// matter of comfort: a signature writes a name, a city and a political
    /// opinion, and a script that could walk through accounts would be building
    /// a list of them. Partitioned by user first, so one account cannot spread
    /// its attempts across addresses.
    /// </summary>
    public const string PetitionSign = "petition-sign";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Register,
        Login,
        Comments,
        ProblemReports,
        MembershipApplications,
        Votes,
        AdminWrites,
        AssemblyLive,
        PetitionSign
    };
}
