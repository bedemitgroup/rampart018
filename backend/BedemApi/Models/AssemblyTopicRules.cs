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
    public static string? WhyCannotDelete(AssemblyTopic topic) =>
        topic.VotingStatus != AssemblyVotingStatus.NotOpened
            ? "Tačka o kojoj se glasalo se ne briše — ona je zapis odluke."
            : null;

    /// <summary>The agenda freezes once the sitting starts deciding.</summary>
    public static string? WhyCannotReorder(AssemblySession session) =>
        session.Status is AssemblySessionStatus.Finished or AssemblySessionStatus.Cancelled
            ? "Sednica je zatvorena — dnevni red se više ne menja."
            : null;
}
