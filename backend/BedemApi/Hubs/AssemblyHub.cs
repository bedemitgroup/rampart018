using System.Security.Claims;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Hubs;

/// <summary>
/// The live channel behind the assembly hall.
/// </summary>
/// <remarks>
/// Deliberately thin: it does group membership and presence, nothing else.
/// Every write still goes through <c>AssemblyController</c>, which is where the
/// validation, the audit trail and the rate limits are — a second copy of those
/// rules living in a hub method is how the two drift apart.
/// </remarks>
// Watching, not sitting: an Admin holds no seat in the hall but has to see the
// room he chairs, so this is the wider ViewPanel rather than the roll.
[Authorize(Roles = Roles.ViewPanel)]
public class AssemblyHub : Hub
{
    /// <summary>
    /// Where the hub is mapped. Written once because Program.cs needs the same
    /// string to decide which requests may carry a token in the query string.
    /// </summary>
    public const string Path = "/hubs/skupstina";

    /// <summary>Method names the browser listens on.</summary>
    public static class Events
    {
        public const string PresenceSnapshot = "PresenceSnapshot";
        public const string MemberJoined = "MemberJoined";
        public const string MemberLeft = "MemberLeft";
        public const string SeatChanged = "SeatChanged";
        public const string SessionChanged = "SessionChanged";
        public const string TopicChanged = "TopicChanged";
        public const string TopicRemoved = "TopicRemoved";
        public const string AgendaReordered = "AgendaReordered";
        public const string VoteTally = "VoteTally";
    }

    private readonly AppDbContext _db;
    private readonly IAssemblyPresenceTracker _presence;

    public AssemblyHub(AppDbContext db, IAssemblyPresenceTracker presence)
    {
        _db = db;
        _presence = presence;
    }

    public static string GroupName(int sessionId) => $"session-{sessionId}";

    /// <summary>
    /// Re-checks the account against the database before letting anyone in.
    /// The JWT carries a role and lives seven days, so it outlives the
    /// membership it was issued against — tolerable for a comment, not for a
    /// hall where votes are cast. One row per connection closes that window.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = CurrentUserId();

        var live = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.IsActive, u.Role })
            .FirstOrDefaultAsync();

        if (live is null || !AssemblyEligibility.CanWatch(live.IsActive, live.Role))
        {
            Context.Abort();
            return;
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Enter one session's hall. Safe to call more than once per connection —
    /// React's StrictMode double-mount and every reconnect do exactly that.
    /// </summary>
    public async Task JoinSession(int sessionId)
    {
        var exists = await _db.AssemblySessions.AsNoTracking().AnyAsync(s => s.Id == sessionId);
        if (!exists) return;

        var who = new AssemblyPresenceResponse(
            CurrentUserId(),
            Context.User?.FindFirstValue("username") ?? "?",
            Context.User?.FindFirstValue(ClaimTypes.Role) ?? "?");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(sessionId));

        var isFirstConnection = _presence.Add(sessionId, Context.ConnectionId, who);

        // Full snapshot to the newcomer only, a delta to everyone already in
        // the room. After a backend restart every client reconnects within the
        // same second; snapshotting all of them to all of them would be O(N^2)
        // frames for no gain.
        await Clients.Caller.SendAsync(Events.PresenceSnapshot, _presence.InSession(sessionId));

        if (isFirstConnection)
            await Clients.OthersInGroup(GroupName(sessionId)).SendAsync(Events.MemberJoined, who);
    }

    public async Task LeaveSession(int sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(sessionId));
        await AnnounceDepartureAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await AnnounceDepartureAsync();
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Tells the room only when the member's <b>last</b> connection is gone —
    /// a second tab, or a reconnect that overlapped the old socket, must not
    /// empty his seat.
    /// </summary>
    private async Task AnnounceDepartureAsync()
    {
        var gone = _presence.Remove(Context.ConnectionId);
        if (gone is null) return;

        var (sessionId, userId) = gone.Value;
        await Clients.Group(GroupName(sessionId)).SendAsync(Events.MemberLeft, userId);
    }

    private int CurrentUserId() => int.Parse(Context.User!.FindFirstValue("userId")!);
}
