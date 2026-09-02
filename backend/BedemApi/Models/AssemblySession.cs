namespace BedemApi.Models;

/// <summary>
/// One sitting of the assembly: when it is, where it is, and what state it is
/// in. The chair announces it, members answer with an
/// <see cref="AssemblyAttendance"/>, and the agenda hangs off it as
/// <see cref="AssemblyTopic"/> rows.
/// </summary>
/// <remarks>
/// At most one session may be <see cref="AssemblySessionStatus.InProgress"/> at
/// a time. That is enforced by a filtered unique index rather than by a check
/// in the controller, because the hall, the presence tracker and "which session
/// am I in" all assume it — one statement in the schema beats four guards that
/// can drift apart.
/// </remarks>
public class AssemblySession
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Always UTC. This is the first client-supplied instant in the project —
    /// the request DTO takes a <c>DateTimeOffset</c> and converts, because
    /// Npgsql refuses a <c>DateTime</c> whose Kind is not Utc.
    /// </summary>
    public DateTime ScheduledAt { get; set; }

    /// <summary>Where the room is. Null for a session held only online.</summary>
    public string? Location { get; set; }

    /// <summary>Meeting link. Validated as http/https — it is rendered as an href.</summary>
    public string? OnlineUrl { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = AssemblySessionStatus.Scheduled;

    /// <summary>
    /// How many eligible members must be present for the sitting to decide.
    /// Null means the association has no quorum rule, which is the default —
    /// the number is shown either way, it just does not block a ballot.
    /// </summary>
    public int? QuorumRequired { get; set; }

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime? OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<AssemblyAttendance> Attendances { get; set; } = new List<AssemblyAttendance>();
    public ICollection<AssemblyTopic> Topics { get; set; } = new List<AssemblyTopic>();
}
