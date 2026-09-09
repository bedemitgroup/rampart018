namespace BedemApi.Models;

/// <summary>
/// A bucket that finance entries are filed under — "Članarine", "Plate i
/// naknade". Carries the bar colour the public page paints it with, so the
/// palette is data rather than something hardcoded in the page.
/// </summary>
public class FinanceCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>"Income" or "Expense". Entries inherit it from the category.</summary>
    public string Type { get; set; } = FinanceCategoryType.Expense;

    /// <summary>One of <see cref="FinanceCategoryColors.All"/>.</summary>
    public string Color { get; set; } = FinanceCategoryColors.Neutral;

    public int DisplayOrder { get; set; }

    /// <summary>Inactive categories stay on their old entries but can no longer be picked.</summary>
    public bool IsActive { get; set; } = true;

    public ICollection<FinanceEntry> Entries { get; set; } = new List<FinanceEntry>();
}

public static class FinanceCategoryType
{
    public const string Income = "Income";
    public const string Expense = "Expense";

    public static readonly IReadOnlyList<string> All = new[] { Income, Expense };
}

/// <summary>
/// Mirrors the <c>.finansije-bar__fill--*</c> modifiers in Finansije.css.
/// Adding a value here means adding the matching CSS rule there.
/// </summary>
public static class FinanceCategoryColors
{
    public const string Primary = "primary";
    public const string Secondary = "secondary";
    public const string Accent = "accent";
    public const string Success = "success";
    public const string Neutral = "neutral";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Primary, Secondary, Accent, Success, Neutral
    };
}
