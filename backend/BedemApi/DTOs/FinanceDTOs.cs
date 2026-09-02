namespace BedemApi.DTOs;

// ---------------------------------------------------------------------------
// Public overview — one call carrying everything /finansije renders.
// ---------------------------------------------------------------------------

public record FinanceOverviewResponse(
    int Year,
    IReadOnlyList<int> AvailableYears,
    FinanceSummaryResponse Summary,
    IReadOnlyList<FinanceBreakdownItemResponse> Income,
    IReadOnlyList<FinanceBreakdownItemResponse> Expenses,
    IReadOnlyList<FinanceQuarterResponse> Quarters,
    IReadOnlyList<FinanceAnnualReportResponse> AnnualReports
);

public record FinanceSummaryResponse(
    decimal TotalIncome,
    decimal TotalExpenses,
    decimal ReserveFund,
    int MemberCount
);

public record FinanceBreakdownItemResponse(
    string Name,
    decimal Amount,
    int Percent,
    string Color
);

public record FinanceQuarterResponse(
    int Year,
    int Quarter,
    string Label,
    decimal Income,
    decimal Expenses,
    decimal Balance,
    bool HasEntries,
    string Status
);

public record FinanceAnnualReportResponse(
    int Year,
    decimal TotalIncome,
    decimal TotalExpenses,
    int MemberCount,
    string? ReportUrl
);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

public record CreateFinanceCategoryRequest(string Name, string Type, string Color, bool IsActive);

public record UpdateFinanceCategoryRequest(string Name, string Color, bool IsActive);

public record MoveFinanceCategoryRequest(string Direction);

public record FinanceCategoryResponse(
    int Id,
    string Name,
    string Type,
    string Color,
    int DisplayOrder,
    bool IsActive,
    int EntryCount
);

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

public record CreateFinanceEntryRequest(int CategoryId, decimal Amount, DateOnly Date, string Description);

public record UpdateFinanceEntryRequest(int CategoryId, decimal Amount, DateOnly Date, string Description);

public record FinanceEntryResponse(
    int Id,
    int CategoryId,
    string CategoryName,
    string Type,
    decimal Amount,
    DateOnly Date,
    string Description,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

// ---------------------------------------------------------------------------
// Years and quarters
// ---------------------------------------------------------------------------

public record UpsertFinanceYearRequest(int MemberCount, decimal ReserveFund, string? ReportUrl, bool IsPublished);

public record UpsertFinanceQuarterRequest(string Status);

public record FinanceYearResponse(
    int Year,
    int MemberCount,
    decimal ReserveFund,
    string? ReportUrl,
    bool IsPublished,
    decimal TotalIncome,
    decimal TotalExpenses,
    IReadOnlyList<FinanceQuarterResponse> Quarters
);
