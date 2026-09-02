namespace BedemApi.Models;

/// <summary>
/// A single booked amount. Everything the public finance page shows — totals,
/// percentages, quarterly balances — is aggregated from these rows, so the
/// figures can never drift apart from each other.
/// </summary>
public class FinanceEntry
{
    public int Id { get; set; }

    public int CategoryId { get; set; }

    /// <summary>Also decides whether this is income or an expense.</summary>
    public FinanceCategory Category { get; set; } = null!;

    /// <summary>Always positive. Direction comes from the category, not the sign.</summary>
    public decimal Amount { get; set; }

    /// <summary>Drives which year and quarter the entry lands in.</summary>
    public DateOnly Date { get; set; }

    public string Description { get; set; } = string.Empty;

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
