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

    public static readonly IReadOnlyList<string> All = new[]
    {
        Register,
        Login,
        Comments,
        ProblemReports,
        MembershipApplications,
        Votes,
        AdminWrites
    };
}
