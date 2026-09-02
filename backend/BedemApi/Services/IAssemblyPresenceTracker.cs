using BedemApi.DTOs;

namespace BedemApi.Services;

/// <summary>
/// Who is connected to a session's hall right this second. Transient by
/// definition — it is a green dot, not the attendance record.
/// </summary>
public interface IAssemblyPresenceTracker
{
    /// <summary>Registers a connection.</summary>
    /// <returns>True when this is the member's first connection to that session.</returns>
    bool Add(int sessionId, string connectionId, AssemblyPresenceResponse who);

    /// <summary>Forgets a connection.</summary>
    /// <returns>
    /// The session and member that just went fully offline, or null when the
    /// member still has another tab open — or when the connection never joined.
    /// </returns>
    (int SessionId, int UserId)? Remove(string connectionId);

    /// <summary>Everyone currently connected to one session.</summary>
    IReadOnlyList<AssemblyPresenceResponse> InSession(int sessionId);

    /// <summary>The user ids currently connected to one session.</summary>
    IReadOnlySet<int> UserIdsInSession(int sessionId);
}
