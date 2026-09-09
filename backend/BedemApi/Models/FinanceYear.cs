namespace BedemApi.Models;

/// <summary>
/// The per-year figures that cannot be derived from entries: the member count,
/// the reserve fund carried forward, and the link to the filed annual report.
/// </summary>
public class FinanceYear
{
    public int Id { get; set; }

    public int Year { get; set; }

    public int MemberCount { get; set; }

    /// <summary>"Stanje fonda" — reserves carried into the next year.</summary>
    public decimal ReserveFund { get; set; }

    /// <summary>External link to the filed report (e.g. APR). Optional.</summary>
    public string? ReportUrl { get; set; }

    /// <summary>Unpublished years are visible to moderators only.</summary>
    public bool IsPublished { get; set; } = true;
}
