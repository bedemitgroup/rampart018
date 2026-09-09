namespace BedemApi.Models;

/// <summary>
/// The transitions a topic is allowed to make. <see cref="AssemblyTopic.Status"/>
/// and <see cref="AssemblyTopic.VotingStatus"/> are independent state machines,
/// so nothing in the schema stops a rejected topic from having an open ballot.
/// Every rule that would prevent it lives here, once, instead of as scattered
/// <c>if</c>s across three endpoints.
///
/// Each method returns the Serbian message explaining the refusal, or null when
/// the move is allowed — the same shape as <c>FinanceController.ValidateEntryAsync</c>.
/// </summary>
public static class AssemblyTopicRules
{
    public static string? WhyCannotOpenVoting(AssemblyTopic topic, AssemblySession session) =>
        session.Status != AssemblySessionStatus.InProgress
            ? "Sednica nije u toku."
        : topic.Status != AssemblyTopicStatus.Accepted
            ? "Tačka nije prihvaćena za dnevni red."
        : topic.VotingStatus == AssemblyVotingStatus.Open
            ? "Glasanje je već otvoreno."
        : topic.VotingStatus == AssemblyVotingStatus.Closed
            ? "Glasanje je već zatvoreno i ne može se ponovo otvoriti."
        : null;

    public static string? WhyCannotCloseVoting(AssemblyTopic topic) =>
        topic.VotingStatus != AssemblyVotingStatus.Open
            ? "Glasanje za ovu tačku nije otvoreno."
            : null;

    public static string? WhyCannotVote(AssemblyTopic topic) =>
        topic.VotingStatus != AssemblyVotingStatus.Open
            ? "Glasanje za ovu tačku nije otvoreno."
            : null;

    /// <summary>
    /// A topic that has been voted on is a record of a decision. The FK is
    /// RESTRICT so the database refuses too, but the caller deserves a sentence
    /// rather than a 500.
    /// </summary>
    public static string? WhyCannotDelete(AssemblyTopic topic, bool isChair, int currentUserId)
    {
        if (topic.VotingStatus != AssemblyVotingStatus.NotOpened)
            return "Tačka o kojoj se glasalo se ne briše — ona je zapis odluke.";

        if (isChair) return null;

        // A member may take back what he proposed, but only while it is still
        // his — once the chairman has ruled on it, the ruling is the record.
        if (topic.ProposedByUserId != currentUserId)
            return "Možeš brisati samo svoje predloge.";

        return topic.Status == AssemblyTopicStatus.Proposed
            ? null
            : "Predlog o kome je Skupština već odlučila se ne briše.";
    }

    /// <summary>
    /// Who may still change the text. The chairman edits anything up to the
    /// ballot; the proposer only his own, and only while it is unreviewed —
    /// otherwise an accepted topic could be rewritten into something else after
    /// the room already agreed to it.
    /// </summary>
    public static string? WhyCannotEdit(AssemblyTopic topic, bool isChair, int currentUserId)
    {
        if (topic.VotingStatus != AssemblyVotingStatus.NotOpened)
            return "Glasanje je počelo — tačka se više ne menja.";

        if (isChair) return null;

        if (topic.ProposedByUserId != currentUserId)
            return "Možeš menjati samo svoje predloge.";

        return topic.Status == AssemblyTopicStatus.Proposed
            ? null
            : "Predlog o kome je Skupština već odlučila se ne menja.";
    }

    /// <summary>Accepting or rejecting a proposal.</summary>
    public static string? WhyCannotReview(AssemblyTopic topic) =>
        topic.VotingStatus != AssemblyVotingStatus.NotOpened
            ? "Glasanje je počelo — odluka o dnevnom redu se više ne menja."
        : topic.Status == AssemblyTopicStatus.Withdrawn
            ? "Predlog je povučen."
            : null;

    /// <summary>Moving a topic between the backlog and a sitting.</summary>
    public static string? WhyCannotAssign(AssemblyTopic topic, AssemblySession? target)
    {
        if (topic.VotingStatus != AssemblyVotingStatus.NotOpened)
            return "Glasanje je počelo — tačka se više ne premešta.";

        if (target is not null &&
            target.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled)
            return "Ta sednica je zatvorena — tačka se u nju ne može staviti.";

        return null;
    }

    /// <summary>
    /// The agenda freezes once the sitting starts deciding: reordering under a
    /// room that has already voted on item three would make the minutes lie.
    /// </summary>
    public static string? WhyCannotReorder(AssemblySession session, bool anyVotingStarted) =>
        session.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled
            ? "Sednica je zatvorena — dnevni red se više ne menja."
        : anyVotingStarted
            ? "Glasanje je počelo — redosled tačaka je zaključan."
            : null;
}
