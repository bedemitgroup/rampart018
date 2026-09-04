using BedemApi.Data;
using BedemApi.Models;

namespace BedemApi.Services;

/// <summary>
/// Who sits in the assembly, and who merely watches it.
///
/// Four different questions need the roll — the seats in the hall, the quorum
/// line, the denominator under a tally, and who is scored for turning up — so
/// it is written once here rather than four times as a <c>Where</c> clause that
/// can drift.
/// </summary>
public static class AssemblyEligibility
{
    /// <summary>
    /// The roll: every active account that actually sits in the assembly.
    /// Mirrors <see cref="Roles.AssemblyParticipants"/>, so a Visitor is absent
    /// (registering is not membership) and so is an Admin (administering the
    /// site is not membership either).
    /// </summary>
    public static IQueryable<User> Roll(AppDbContext db) =>
        db.Users.Where(u => u.IsActive && Roles.AssemblyRoll.Contains(u.Role));

    /// <summary>
    /// Whether a single account sits in the assembly — may vote, check in, and
    /// be scored. Used where the row is already loaded: the vote endpoint and
    /// the chairman's correction of the roll, because a JWT carries a role for
    /// seven days and outlives the membership behind it.
    /// </summary>
    public static bool CanTakePart(bool isActive, string role) =>
        isActive && Roles.AssemblyRoll.Contains(role);

    /// <summary>
    /// Whether an account may watch a sitting: everyone the organisation
    /// admitted, the Admin included. Deliberately wider than
    /// <see cref="CanTakePart"/> — the chairman has to see the room he is
    /// running even though he holds no seat in it.
    /// </summary>
    public static bool CanWatch(bool isActive, string role) =>
        isActive && role != Roles.Visitor;
}
