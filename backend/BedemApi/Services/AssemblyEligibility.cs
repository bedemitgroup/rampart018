using BedemApi.Data;
using BedemApi.Models;

namespace BedemApi.Services;

/// <summary>
/// Who sits in the assembly. Four different questions need this exact set — the
/// seats in the hall, the quorum line, the denominator under a tally, and who
/// the hub lets connect — so it is written once here rather than four times as
/// a <c>Where</c> clause that can drift.
/// </summary>
public static class AssemblyEligibility
{
    /// <summary>
    /// The roll: every active account the organisation admitted. Mirrors
    /// <see cref="Roles.AssemblyParticipants"/>; a Visitor is deliberately
    /// absent, because registering on the site is not membership.
    /// </summary>
    public static IQueryable<User> Roll(AppDbContext db) =>
        db.Users.Where(u => u.IsActive && u.Role != Roles.Visitor);

    /// <summary>
    /// Whether a single account may take part. Used where the row is already
    /// loaded — the hub's connect check and the vote endpoint — because the JWT
    /// carries a role for seven days and outlives the membership behind it.
    /// </summary>
    public static bool CanTakePart(bool isActive, string role) =>
        isActive && role != Roles.Visitor;
}
