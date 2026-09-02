using BedemApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Data;

/// <summary>
/// Seeds the category list the finance page used to have baked in, so there is
/// something to file entries under on day one. No figures are seeded — every
/// amount, year and quarter status is entered from the admin panel.
///
/// These categories carry no entries, so they can be renamed, recoloured,
/// reordered or deleted outright from the panel.
/// </summary>
internal static class FinanceSeed
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FinanceCategory>().HasData(
            // Income
            new FinanceCategory { Id = 1, Name = "Članarine", Type = FinanceCategoryType.Income, Color = FinanceCategoryColors.Primary, DisplayOrder = 0, IsActive = true },
            new FinanceCategory { Id = 2, Name = "Donacije građana", Type = FinanceCategoryType.Income, Color = FinanceCategoryColors.Secondary, DisplayOrder = 1, IsActive = true },
            new FinanceCategory { Id = 3, Name = "Donacije organizacija", Type = FinanceCategoryType.Income, Color = FinanceCategoryColors.Success, DisplayOrder = 2, IsActive = true },
            new FinanceCategory { Id = 4, Name = "Prihodi od projekata", Type = FinanceCategoryType.Income, Color = FinanceCategoryColors.Neutral, DisplayOrder = 3, IsActive = true },

            // Expenses
            new FinanceCategory { Id = 5, Name = "Pravna pomoć i zastupanje", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Primary, DisplayOrder = 0, IsActive = true },
            new FinanceCategory { Id = 6, Name = "Organizovanje akcija", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Secondary, DisplayOrder = 1, IsActive = true },
            new FinanceCategory { Id = 7, Name = "Plate i naknade", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Accent, DisplayOrder = 2, IsActive = true },
            new FinanceCategory { Id = 8, Name = "Administrativni troškovi", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Neutral, DisplayOrder = 3, IsActive = true },
            new FinanceCategory { Id = 9, Name = "Komunikacije i marketing", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Success, DisplayOrder = 4, IsActive = true },
            new FinanceCategory { Id = 10, Name = "Rezerve i fond", Type = FinanceCategoryType.Expense, Color = FinanceCategoryColors.Neutral, DisplayOrder = 5, IsActive = true }
        );
    }
}
