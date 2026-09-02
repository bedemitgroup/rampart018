using System.Security.Claims;

namespace BedemApi.Models;

/// <summary>
/// Every role the site knows about, and the role lists that [Authorize] needs.
///
/// The ladder is: a Visitor registers himself and can only talk (comments and
/// likes). A Member is someone the organisation actually let in — he votes at
/// the assembly. The three staff roles are a Member plus exactly one area they
/// administer: Moderator the news, Finance the money, Assembly the sessions.
/// Nobody but Admin holds two areas at once, so a compromised staff account
/// can only damage its own section.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Moderator = "Moderator";
    public const string Finance = "Finance";
    public const string Assembly = "Assembly";
    public const string Member = "Member";
    public const string Visitor = "Visitor";

    // -----------------------------------------------------------------------
    // Role lists, in the comma-separated shape [Authorize(Roles = ...)] wants.
    // Controllers read the same constants through User.IsIn(), so an attribute
    // and the check behind it can never drift apart.
    // -----------------------------------------------------------------------

    /// <summary>Write access to news. Everyone else reads what is published.</summary>
    public const string ManageNews = $"{Moderator},{Admin}";

    /// <summary>Write access to finance. Everyone else reads the public figures.</summary>
    public const string ManageFinance = $"{Finance},{Admin}";

    /// <summary>Write access to assembly sessions — agenda items and the room.</summary>
    public const string ManageAssembly = $"{Assembly},{Admin}";

    /// <summary>Inbox work: problem reports, membership applications, bot log.</summary>
    public const string ManageSubmissions = $"{Moderator},{Admin}";

    /// <summary>Comment moderation: approving pending comments and deleting them.</summary>
    public const string ManageComments = $"{Moderator},{Admin}";

    /// <summary>Accounts, roles and the audit log.</summary>
    public const string ManageUsers = Admin;

    /// <summary>Anyone who has some section of his own to administer.</summary>
    public const string Staff = $"{Moderator},{Finance},{Assembly},{Admin}";

    /// <summary>
    /// Read access to the admin panel: news drafts, the finance ledger, problem
    /// reports, membership applications. Everyone the organisation admitted may
    /// look at what the others are doing; only his own section gets buttons.
    /// A Visitor is absent — registering on the site is not membership.
    ///
    /// Coincides with <see cref="AssemblyParticipants"/> today, but answers a
    /// different question, so the two are kept apart.
    /// </summary>
    public const string ViewPanel = $"{Member},{Moderator},{Finance},{Assembly},{Admin}";

    /// <summary>
    /// Who takes part in an assembly session — everyone the organisation admitted.
    /// A Visitor is deliberately absent: registering on the site is not membership.
    /// </summary>
    public const string AssemblyParticipants = $"{Member},{Moderator},{Finance},{Assembly},{Admin}";

    /// <summary>Every role, for validation when an admin changes someone's role.</summary>
    public static readonly IReadOnlyList<string> All = new[]
    {
        Admin, Moderator, Finance, Assembly, Member, Visitor
    };

    /// <summary>
    /// Roles an admin can hand out when creating an account outright. Admin is
    /// missing on purpose: promoting someone to Admin stays a separate,
    /// deliberate step through the role-change endpoint.
    /// </summary>
    public static readonly IReadOnlyList<string> Creatable = new[]
    {
        Moderator, Finance, Assembly, Member
    };

    public static bool IsKnown(string? role) => role != null && All.Contains(role);
}

public static class RoleClaimExtensions
{
    /// <summary>
    /// True when the caller holds any role in <paramref name="roleList"/> — the
    /// same comma-separated constant used by the [Authorize] attribute.
    /// </summary>
    public static bool IsIn(this ClaimsPrincipal principal, string roleList)
    {
        if (principal.Identity?.IsAuthenticated != true) return false;

        foreach (var role in roleList.Split(','))
        {
            if (principal.IsInRole(role.Trim())) return true;
        }

        return false;
    }
}
