using BedemApi.DTOs;
using BedemApi.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BedemApi.Services;

/// <summary>
/// The one place that talks to the hub from outside it. Registered as a
/// singleton, matching <see cref="IHubContext{T}"/>'s own lifetime — a scoped
/// registration would work but implies a dependency on the request that does
/// not exist, and invites someone to put a DbContext in here later.
/// </summary>
public class AssemblyNotifier : IAssemblyNotifier
{
    private readonly IHubContext<AssemblyHub> _hub;
    private readonly ILogger<AssemblyNotifier> _logger;

    public AssemblyNotifier(IHubContext<AssemblyHub> hub, ILogger<AssemblyNotifier> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task SeatChangedAsync(int sessionId, AssemblySeatResponse seat) =>
        SendAsync(sessionId, AssemblyHub.Events.SeatChanged, seat);

    public Task SessionChangedAsync(int sessionId, AssemblySessionResponse session) =>
        SendAsync(sessionId, AssemblyHub.Events.SessionChanged, session);

    public Task TopicChangedAsync(int sessionId, AssemblyTopicResponse topic) =>
        SendAsync(sessionId, AssemblyHub.Events.TopicChanged, topic);

    public Task TopicRemovedAsync(int sessionId, int topicId) =>
        SendAsync(sessionId, AssemblyHub.Events.TopicRemoved, topicId);

    public Task AgendaReorderedAsync(int sessionId, IReadOnlyList<AssemblyTopicResponse> agenda) =>
        SendAsync(sessionId, AssemblyHub.Events.AgendaReordered, agenda);

    /// <summary>
    /// Never throws. The caller has already committed; the acting client gets
    /// its answer from the HTTP response either way, and everyone else
    /// re-fetches over REST when the socket comes back.
    /// </summary>
    private async Task SendAsync(int sessionId, string method, object payload)
    {
        try
        {
            await _hub.Clients.Group(AssemblyHub.GroupName(sessionId)).SendAsync(method, payload);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Skupstina: broadcast {Method} for session {SessionId} failed.", method, sessionId);
        }
    }
}
