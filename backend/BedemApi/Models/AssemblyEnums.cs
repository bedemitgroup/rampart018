namespace BedemApi.Models;

/// <summary>
/// Where a session is in its life. Stored as text in the Serbian wording the
/// panel shows, the same way <see cref="FinanceQuarterStatus"/> does — the
/// value in the database is the value on screen, so a row is readable in
/// pgAdmin without a lookup table.
/// </summary>
public static class AssemblySessionStatus
{
    /// <summary>Announced, taking RSVPs, agenda still open.</summary>
    public const string Scheduled = "Zakazana";

    /// <summary>Sitting right now. Only one session may hold this at a time.</summary>
    public const string InProgress = "U toku";

    /// <summary>Adjourned. Ballots are frozen and the agenda is a record.</summary>
    public const string Finished = "Završena";

    /// <summary>Called off before it ever sat.</summary>
    public const string Cancelled = "Otkazana";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Scheduled, InProgress, Finished, Cancelled
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>
/// What a member answered when the session was announced. This is an
/// intention, not a fact — whether he actually turned up is
/// <c>AssemblyAttendance.CheckedInAt</c>, and whether he is connected this
/// second is the presence tracker. The three are deliberately separate.
/// </summary>
public static class AssemblyRsvp
{
    public const string Attending = "Dolazim";
    public const string Online = "Online";
    public const string Unsure = "Nisam siguran";
    public const string Absent = "Ne dolazim";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Attending, Online, Unsure, Absent
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>How a member is taking part once he has checked in.</summary>
public static class AssemblyCheckInMode
{
    public const string InPerson = "Uživo";
    public const string Online = "Online";

    public static readonly IReadOnlyList<string> All = new[] { InPerson, Online };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>
/// Whether a proposed topic made it onto the agenda. Anyone the organisation
/// admitted may propose; only the Assembly chair moves a topic out of
/// <see cref="Proposed"/>.
/// </summary>
public static class AssemblyTopicStatus
{
    public const string Proposed = "Predložena";
    public const string Accepted = "Prihvaćena";
    public const string Rejected = "Odbijena";

    /// <summary>Taken back by whoever proposed it, before it was reviewed.</summary>
    public const string Withdrawn = "Povučena";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Proposed, Accepted, Rejected, Withdrawn
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>
/// The ballot window on one agenda item. Kept apart from
/// <see cref="AssemblyTopicStatus"/> because they answer different questions:
/// one is "is this on the agenda", the other is "may I vote right now".
/// </summary>
public static class AssemblyVotingStatus
{
    public const string NotOpened = "Nije otvoreno";
    public const string Open = "U toku";
    public const string Closed = "Zatvoreno";

    public static readonly IReadOnlyList<string> All = new[]
    {
        NotOpened, Open, Closed
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>How a member voted. Votes are public per member, by design.</summary>
public static class AssemblyVoteChoice
{
    public const string For = "Za";
    public const string Against = "Protiv";
    public const string Abstained = "Uzdržan";

    public static readonly IReadOnlyList<string> All = new[]
    {
        For, Against, Abstained
    };

    public static bool IsKnown(string? value) => value != null && All.Contains(value);
}

/// <summary>
/// What turning up is worth. One place, so the association can change what it
/// rewards without anyone hunting through the controller for the numbers —
/// and past sittings keep whatever they were awarded, because
/// <see cref="AssemblyPoint.Points"/> stores the result rather than the rule.
/// </summary>
public static class AssemblyPointRule
{
    /// <summary>On the floor, in the room or on the call. Both count the same.</summary>
    public const int Present = 1;

    /// <summary>Did not turn up.</summary>
    public const int Absent = -1;

    public static int For(bool attended) => attended ? Present : Absent;
}

/// <summary>The verdict on a closed ballot. Computed, never stored.</summary>
public static class AssemblyOutcome
{
    public const string Passed = "Usvojeno";
    public const string Failed = "Odbijeno";
    public const string Pending = "U toku";
    public const string NotOpened = "Nije glasano";
}
