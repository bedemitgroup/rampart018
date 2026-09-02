namespace BedemApi.Models;

/// <summary>
/// Approval state of one quarter. The money in the quarterly table is summed
/// from entries; only the status is a human decision, so only it is stored.
/// A missing row reads as <see cref="FinanceQuarterStatus.NotStarted"/>.
/// </summary>
public class FinanceQuarter
{
    public int Id { get; set; }

    public int Year { get; set; }

    /// <summary>1 to 4.</summary>
    public int Quarter { get; set; }

    public string Status { get; set; } = FinanceQuarterStatus.NotStarted;
}

public static class FinanceQuarterStatus
{
    public const string Approved = "Usvojen";
    public const string InProgress = "U toku";
    public const string NotStarted = "Nije počeo";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Approved, InProgress, NotStarted
    };
}
