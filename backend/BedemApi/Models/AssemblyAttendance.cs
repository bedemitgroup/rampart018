namespace BedemApi.Models;

/// <summary>
/// One member's relationship to one session, in two layers that are
/// deliberately not the same field:
///
/// <list type="bullet">
/// <item><see cref="Response"/> is the <b>intention</b> — what he answered when
/// the session was announced.</item>
/// <item><see cref="CheckedInAt"/> is the <b>fact</b> — he was in the room, or
/// on the call, when it sat.</item>
/// </list>
///
/// A third layer, "is he connected this very second", is not here on purpose:
/// that is transient, it belongs to the presence tracker in memory, and it
/// lags reality by up to half a minute whenever a laptop lid closes. Attendance
/// is a record; presence is a green dot.
/// </summary>
public class AssemblyAttendance
{
    public int Id { get; set; }

    public int SessionId { get; set; }
    public AssemblySession Session { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>One of <see cref="AssemblyRsvp"/>.</summary>
    public string Response { get; set; } = AssemblyRsvp.Unsure;

    /// <summary>Free text, e.g. "kasnim pola sata".</summary>
    public string? Note { get; set; }

    public DateTime? CheckedInAt { get; set; }

    /// <summary>One of <see cref="AssemblyCheckInMode"/>, set with the check-in.</summary>
    public string? CheckInMode { get; set; }

    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
