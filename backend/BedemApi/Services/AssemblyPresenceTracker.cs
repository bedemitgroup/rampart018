using BedemApi.DTOs;

namespace BedemApi.Services;

/// <summary>
/// Live presence, held in memory behind a single lock.
/// </summary>
/// <remarks>
/// <para>
/// One lock over plain dictionaries rather than a tree of
/// <c>ConcurrentDictionary</c>, deliberately. "Drop the last connection, then
/// drop the now-empty seat, then drop the now-empty session" is a composite
/// operation: concurrent collections would make each step atomic and leave the
/// whole thing wrong, so a member who opens a second tab in that gap could
/// vanish from the hall while holding a live socket. A hall holds a few dozen
/// people, so there is no contention to optimise away.
/// </para>
/// <para>
/// Everything is keyed by <b>connectionId</b>, never by user id. SignalR does
/// not guarantee that the old connection's <c>OnDisconnectedAsync</c> runs
/// before the new one's <c>OnConnectedAsync</c> on a reconnect; keying by
/// connection makes that harmless — a member shows up twice for a moment —
/// whereas keying by user gives the classic "my seat goes dark when the wifi
/// blinks" bug.
/// </para>
/// <para>
/// Single instance only. This dictionary and SignalR's own group membership
/// both live in the process, so a second backend replica would give you two
/// half-full halls. Growing past one container means adding a Redis backplane.
/// </para>
/// </remarks>
public sealed class AssemblyPresenceTracker : IAssemblyPresenceTracker
{
    private sealed class Seat
    {
        public required AssemblyPresenceResponse Who { get; init; }
        public HashSet<string> Connections { get; } = new();
    }

    private readonly object _gate = new();
    private readonly Dictionary<string, (int SessionId, int UserId)> _byConnection = new();
    private readonly Dictionary<int, Dictionary<int, Seat>> _bySession = new();

    public bool Add(int sessionId, string connectionId, AssemblyPresenceResponse who)
    {
        lock (_gate)
        {
            _byConnection[connectionId] = (sessionId, who.UserId);

            if (!_bySession.TryGetValue(sessionId, out var seats))
                _bySession[sessionId] = seats = new Dictionary<int, Seat>();

            if (seats.TryGetValue(who.UserId, out var seat))
            {
                seat.Connections.Add(connectionId);
                return false;                       // another tab: say nothing
            }

            seat = new Seat { Who = who };
            seat.Connections.Add(connectionId);
            seats[who.UserId] = seat;
            return true;                            // first tab: announce him
        }
    }

    public (int SessionId, int UserId)? Remove(string connectionId)
    {
        lock (_gate)
        {
            // Not an error path: connections that never called JoinSession
            // disconnect all the time.
            if (!_byConnection.Remove(connectionId, out var found))
                return null;

            var (sessionId, userId) = found;

            if (!_bySession.TryGetValue(sessionId, out var seats)) return null;
            if (!seats.TryGetValue(userId, out var seat)) return null;

            seat.Connections.Remove(connectionId);
            if (seat.Connections.Count > 0) return null;   // other tabs still open

            seats.Remove(userId);
            if (seats.Count == 0) _bySession.Remove(sessionId);

            return (sessionId, userId);
        }
    }

    public IReadOnlyList<AssemblyPresenceResponse> InSession(int sessionId)
    {
        lock (_gate)
        {
            // Copied inside the lock: the caller must not walk our dictionary.
            return _bySession.TryGetValue(sessionId, out var seats)
                ? seats.Values.Select(s => s.Who).ToList()
                : Array.Empty<AssemblyPresenceResponse>();
        }
    }

    public IReadOnlySet<int> UserIdsInSession(int sessionId)
    {
        lock (_gate)
        {
            return _bySession.TryGetValue(sessionId, out var seats)
                ? seats.Keys.ToHashSet()
                : new HashSet<int>();
        }
    }
}
