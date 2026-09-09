namespace BedemApi.Models;

/// <summary>
/// One item of business. Anyone the organisation admitted may propose one; the
/// Assembly chair decides whether it reaches the agenda, and later opens and
/// closes the ballot on it.
/// </summary>
public class AssemblyTopic
{
    public int Id { get; set; }

    /// <summary>
    /// Null on purpose: a topic proposed while no session is scheduled lands in
    /// a backlog and is attached to a sitting later. Without this, proposing
    /// would only work in the window between two sessions.
    /// </summary>
    public int? SessionId { get; set; }
    public AssemblySession? Session { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>One of <see cref="AssemblyTopicStatus"/>.</summary>
    public string Status { get; set; } = AssemblyTopicStatus.Proposed;

    public int ProposedByUserId { get; set; }
    public User ProposedByUser { get; set; } = null!;

    public int? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }

    public DateTime? ReviewedAt { get; set; }

    /// <summary>Why it was rejected, shown back to whoever proposed it.</summary>
    public string? ReviewNote { get; set; }

    /// <summary>
    /// Position within one <c>(SessionId, Status)</c> pair — the same pair the
    /// agenda screen filters on. Ordering across statuses would let an arrow
    /// swap a visible row with an invisible one.
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>One of <see cref="AssemblyVotingStatus"/>.</summary>
    public string VotingStatus { get; set; } = AssemblyVotingStatus.NotOpened;

    public DateTime? VotingOpenedAt { get; set; }
    public DateTime? VotingClosedAt { get; set; }

    /// <summary>
    /// Size of the roll at the instant the ballot opened. Snapshotted because
    /// roles change: without it the denominator of every past decision drifts
    /// with the membership, and "was this vote valid" stops being answerable.
    /// </summary>
    public int EligibleVotersAtOpen { get; set; }

    /// <summary>
    /// How many members were checked in when the ballot closed.
    /// </summary>
    public int PresentAtClose { get; set; }

    /// <summary>
    /// Whether the sitting was quorate at that moment. Frozen rather than
    /// recomputed, and for a different reason than the outcome: the votes stop
    /// changing when the ballot closes, but attendance does not — the chairman
    /// corrects the roll while the sitting runs — and the quorum threshold
    /// itself is a setting somebody can change next year. Without the snapshot
    /// a decision taken last spring would silently gain or lose its "bez
    /// kvoruma" mark every time the rules are edited.
    /// </summary>
    public bool? QuorumMetAtClose { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<AssemblyVote> Votes { get; set; } = new List<AssemblyVote>();
}
