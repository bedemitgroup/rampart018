using BedemApi.DTOs;

namespace BedemApi.Services;

/// <summary>
/// Pushes what just changed to everyone watching a session.
/// </summary>
/// <remarks>
/// Controllers own the writing — validation, audit trail, rate limits — and
/// call this only after the <b>last</b> SaveChanges has returned. That ordering
/// matters: <c>IAuditLogger.RecordAsync</c> performs a second save, so a
/// broadcast placed between the two would publish state whose trail can still
/// fail. Every send is swallowed and logged rather than thrown, because a dead
/// socket must never fail a ballot that is already in the ledger.
/// </remarks>
public interface IAssemblyNotifier
{
    /// <summary>A member's RSVP or check-in changed.</summary>
    Task SeatChangedAsync(int sessionId, AssemblySeatResponse seat);

    /// <summary>The session itself changed — opened, closed, cancelled, edited.</summary>
    Task SessionChangedAsync(int sessionId, AssemblySessionResponse session);
}
