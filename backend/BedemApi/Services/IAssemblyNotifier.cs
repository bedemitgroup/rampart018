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

    /// <summary>One agenda item changed — proposed, reviewed, edited, moved in or out.</summary>
    Task TopicChangedAsync(int sessionId, AssemblyTopicResponse topic);

    /// <summary>An item left this sitting's agenda, for the backlog or the bin.</summary>
    Task TopicRemovedAsync(int sessionId, int topicId);

    /// <summary>
    /// The whole agenda was reordered. Sent as a list rather than two swapped
    /// items so every screen lands on the same order — which is a small win the
    /// news list never had: two chairmen reordering at once converge here
    /// instead of disagreeing until someone reloads.
    /// </summary>
    Task AgendaReorderedAsync(int sessionId, IReadOnlyList<AssemblyTopicResponse> agenda);

    /// <summary>
    /// A ballot moved: opened, closed, or someone voted. Carries the whole
    /// tally and every mark, so a client repaints the room from one frame
    /// rather than accumulating deltas it might have missed.
    /// </summary>
    Task VoteTallyAsync(int sessionId, AssemblyTallyResponse tally);
}
