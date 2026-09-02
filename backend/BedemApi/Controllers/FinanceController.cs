using System.Security.Claims;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/finance")]
public class FinanceController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public FinanceController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    private bool IsModerator => User.Identity?.IsAuthenticated == true &&
        (User.IsInRole("Moderator") || User.IsInRole("Admin"));

    // -----------------------------------------------------------------------
    // Public
    // -----------------------------------------------------------------------

    /// <summary>
    /// Everything the public finance page renders, for one year. Totals and
    /// percentages are summed from entries here rather than stored, so the
    /// figures cannot drift apart from the rows behind them.
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(typeof(FinanceOverviewResponse), 200)]
    public async Task<IActionResult> GetOverview([FromQuery] int? year)
    {
        var yearRows = await _db.FinanceYears.AsNoTracking().ToListAsync();
        var entries = await _db.FinanceEntries
            .AsNoTracking()
            .Include(e => e.Category)
            .ToListAsync();

        // A year without a FinanceYear row is visible by default; a row is what
        // lets an admin hold a year back, the way IsPublished does for news.
        var hiddenYears = IsModerator
            ? new HashSet<int>()
            : yearRows.Where(y => !y.IsPublished).Select(y => y.Year).ToHashSet();

        var availableYears = entries.Select(e => e.Date.Year)
            .Concat(yearRows.Select(y => y.Year))
            .Distinct()
            .Where(y => !hiddenYears.Contains(y))
            .OrderByDescending(y => y)
            .ToList();

        var yearsWithEntries = entries.Select(e => e.Date.Year).ToHashSet();

        var selectedYear = year is int requested && availableYears.Contains(requested)
            ? requested
            : availableYears.FirstOrDefault(y => yearsWithEntries.Contains(y));

        if (selectedYear == 0)
            selectedYear = availableYears.FirstOrDefault(DateTime.UtcNow.Year);

        var yearEntries = entries.Where(e => e.Date.Year == selectedYear).ToList();
        var selectedYearRow = yearRows.FirstOrDefault(y => y.Year == selectedYear);

        var income = BuildBreakdown(yearEntries, FinanceCategoryType.Income);
        var expenses = BuildBreakdown(yearEntries, FinanceCategoryType.Expense);

        var summary = new FinanceSummaryResponse(
            income.Sum(i => i.Amount),
            expenses.Sum(e => e.Amount),
            selectedYearRow?.ReserveFund ?? 0m,
            selectedYearRow?.MemberCount ?? 0);

        var quarterRows = await _db.FinanceQuarters
            .AsNoTracking()
            .Where(q => q.Year == selectedYear)
            .ToListAsync();

        var quarters = BuildQuarters(selectedYear, yearEntries, quarterRows);

        // The archive lists only years that have been given a FinanceYear row —
        // that row is what makes a year a filed report rather than loose entries.
        var annualReports = yearRows
            .Where(y => !hiddenYears.Contains(y.Year))
            .OrderByDescending(y => y.Year)
            .Select(y =>
            {
                var forYear = entries.Where(e => e.Date.Year == y.Year).ToList();
                return new FinanceAnnualReportResponse(
                    y.Year,
                    SumOf(forYear, FinanceCategoryType.Income),
                    SumOf(forYear, FinanceCategoryType.Expense),
                    y.MemberCount,
                    y.ReportUrl);
            })
            .ToList();

        return Ok(new FinanceOverviewResponse(
            selectedYear, availableYears, summary, income, expenses, quarters, annualReports));
    }

    // -----------------------------------------------------------------------
    // Categories
    // -----------------------------------------------------------------------

    /// <summary>List categories. Public callers see only the active ones.</summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(IEnumerable<FinanceCategoryResponse>), 200)]
    public async Task<IActionResult> GetCategories()
    {
        var query = _db.FinanceCategories.AsNoTracking().AsQueryable();

        if (!IsModerator)
            query = query.Where(c => c.IsActive);

        var categories = await query
            .Select(c => new FinanceCategoryResponse(
                c.Id, c.Name, c.Type, c.Color, c.DisplayOrder, c.IsActive, c.Entries.Count))
            .ToListAsync();

        return Ok(OrderCategories(categories));
    }

    /// <summary>Create a category.</summary>
    [HttpPost("categories")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(FinanceCategoryResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateCategory([FromBody] CreateFinanceCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Naziv kategorije je obavezan." });

        if (!FinanceCategoryType.All.Contains(request.Type))
            return BadRequest(new { message = "Tip mora biti 'Income' ili 'Expense'." });

        if (!FinanceCategoryColors.All.Contains(request.Color))
            return BadRequest(new { message = "Nepoznata boja kategorije." });

        var nextOrder = await _db.FinanceCategories
            .Where(c => c.Type == request.Type)
            .Select(c => (int?)c.DisplayOrder)
            .MaxAsync() ?? -1;

        var category = new FinanceCategory
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            Color = request.Color,
            DisplayOrder = nextOrder + 1,
            IsActive = request.IsActive
        };

        _db.FinanceCategories.Add(category);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(
            AuditActions.FinanceCategoryCreate, AuditEntityTypes.FinanceCategory,
            category.Id.ToString(), category.Name);

        return CreatedAtAction(nameof(GetCategories), null, ToResponse(category, 0));
    }

    /// <summary>Update a category. The type never changes — entries are already filed under it.</summary>
    [HttpPut("categories/{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(FinanceCategoryResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateFinanceCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Naziv kategorije je obavezan." });

        if (!FinanceCategoryColors.All.Contains(request.Color))
            return BadRequest(new { message = "Nepoznata boja kategorije." });

        var category = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound();

        category.Name = request.Name.Trim();
        category.Color = request.Color;
        category.IsActive = request.IsActive;

        _audit.Record(
            AuditActions.FinanceCategoryUpdate, AuditEntityTypes.FinanceCategory,
            category.Id.ToString(), category.Name);

        await _db.SaveChangesAsync();

        var entryCount = await _db.FinanceEntries.CountAsync(e => e.CategoryId == id);
        return Ok(ToResponse(category, entryCount));
    }

    /// <summary>Delete a category. Refused while entries are filed under it.</summary>
    [HttpDelete("categories/{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _db.FinanceCategories.FindAsync(id);
        if (category == null) return NotFound();

        if (await _db.FinanceEntries.AnyAsync(e => e.CategoryId == id))
            return BadRequest(new
            {
                message = "Kategorija ima unete stavke — možete je deaktivirati umesto brisanja."
            });

        _audit.Record(
            AuditActions.FinanceCategoryDelete, AuditEntityTypes.FinanceCategory,
            category.Id.ToString(), category.Name);

        _db.FinanceCategories.Remove(category);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Kategorija obrisana." });
    }

    /// <summary>Move a category up or down within its own type. Returns the full reordered list.</summary>
    [HttpPut("categories/{id}/move")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(IEnumerable<FinanceCategoryResponse>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> MoveCategory(int id, [FromBody] MoveFinanceCategoryRequest request)
    {
        if (request.Direction != "up" && request.Direction != "down")
            return BadRequest(new { message = "Direction must be 'up' or 'down'." });

        var category = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == id);
        if (category == null) return NotFound();

        // Reordering happens within a type: income and expense are two separate
        // lists on the page, so moving across them would be meaningless.
        var ordered = await _db.FinanceCategories
            .Where(c => c.Type == category.Type)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Id)
            .ToListAsync();

        for (int i = 0; i < ordered.Count; i++)
            ordered[i].DisplayOrder = i;

        var index = ordered.FindIndex(c => c.Id == id);
        var targetIndex = request.Direction == "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= ordered.Count)
            return BadRequest(new { message = "Kategorija je već na kraju u tom pravcu." });

        (ordered[index].DisplayOrder, ordered[targetIndex].DisplayOrder) =
            (ordered[targetIndex].DisplayOrder, ordered[index].DisplayOrder);

        _audit.Record(
            request.Direction == "up"
                ? AuditActions.FinanceCategoryMoveUp
                : AuditActions.FinanceCategoryMoveDown,
            AuditEntityTypes.FinanceCategory,
            category.Id.ToString(),
            category.Name);

        await _db.SaveChangesAsync();

        var all = await _db.FinanceCategories
            .AsNoTracking()
            .Select(c => new FinanceCategoryResponse(
                c.Id, c.Name, c.Type, c.Color, c.DisplayOrder, c.IsActive, c.Entries.Count))
            .ToListAsync();

        return Ok(OrderCategories(all));
    }

    // -----------------------------------------------------------------------
    // Entries
    // -----------------------------------------------------------------------

    /// <summary>List entries, newest first. Admin-only: the public page shows aggregates.</summary>
    [HttpGet("entries")]
    [Authorize(Roles = "Moderator,Admin")]
    [ProducesResponseType(typeof(IEnumerable<FinanceEntryResponse>), 200)]
    public async Task<IActionResult> GetEntries(
        [FromQuery] int? year,
        [FromQuery] string? type,
        [FromQuery] int? categoryId)
    {
        var query = _db.FinanceEntries.AsNoTracking().Include(e => e.Category).AsQueryable();

        if (year is int y)
            query = query.Where(e => e.Date.Year == y);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(e => e.Category.Type == type);

        if (categoryId is int cid)
            query = query.Where(e => e.CategoryId == cid);

        var entries = await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.Id)
            .ToListAsync();

        return Ok(entries.Select(ToResponse));
    }

    /// <summary>Get a single entry.</summary>
    [HttpGet("entries/{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [ProducesResponseType(typeof(FinanceEntryResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetEntry(int id)
    {
        var entry = await _db.FinanceEntries
            .AsNoTracking()
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entry == null) return NotFound();

        return Ok(ToResponse(entry));
    }

    /// <summary>Book a new income or expense entry.</summary>
    [HttpPost("entries")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(FinanceEntryResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateEntry([FromBody] CreateFinanceEntryRequest request)
    {
        var error = await ValidateEntryAsync(request.CategoryId, request.Amount, request.Description);
        if (error != null) return BadRequest(new { message = error });

        var userId = int.Parse(User.FindFirstValue("userId")!);

        var entry = new FinanceEntry
        {
            CategoryId = request.CategoryId,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description.Trim(),
            CreatedByUserId = userId
        };

        _db.FinanceEntries.Add(entry);
        await _db.SaveChangesAsync();
        await _db.Entry(entry).Reference(e => e.Category).LoadAsync();

        await _audit.RecordAsync(
            AuditActions.FinanceEntryCreate, AuditEntityTypes.FinanceEntry,
            entry.Id.ToString(), DescribeEntry(entry));

        return CreatedAtAction(nameof(GetEntry), new { id = entry.Id }, ToResponse(entry));
    }

    /// <summary>Update an entry.</summary>
    [HttpPut("entries/{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(FinanceEntryResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateEntry(int id, [FromBody] UpdateFinanceEntryRequest request)
    {
        var error = await ValidateEntryAsync(request.CategoryId, request.Amount, request.Description);
        if (error != null) return BadRequest(new { message = error });

        var entry = await _db.FinanceEntries.FirstOrDefaultAsync(e => e.Id == id);
        if (entry == null) return NotFound();

        entry.CategoryId = request.CategoryId;
        entry.Amount = request.Amount;
        entry.Date = request.Date;
        entry.Description = request.Description.Trim();
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _db.Entry(entry).Reference(e => e.Category).LoadAsync();

        // Logged after the reload, so the label names the category the entry was
        // moved to rather than the one it came from.
        await _audit.RecordAsync(
            AuditActions.FinanceEntryUpdate, AuditEntityTypes.FinanceEntry,
            entry.Id.ToString(), DescribeEntry(entry));

        return Ok(ToResponse(entry));
    }

    /// <summary>Delete an entry.</summary>
    [HttpDelete("entries/{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteEntry(int id)
    {
        var entry = await _db.FinanceEntries
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entry == null) return NotFound();

        _audit.Record(
            AuditActions.FinanceEntryDelete, AuditEntityTypes.FinanceEntry,
            entry.Id.ToString(), DescribeEntry(entry));

        _db.FinanceEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Stavka obrisana." });
    }

    // -----------------------------------------------------------------------
    // Years and quarters
    // -----------------------------------------------------------------------

    /// <summary>List every year that has a row or any entries, with its totals and quarter statuses.</summary>
    [HttpGet("years")]
    [Authorize(Roles = "Moderator,Admin")]
    [ProducesResponseType(typeof(IEnumerable<FinanceYearResponse>), 200)]
    public async Task<IActionResult> GetYears()
    {
        var yearRows = await _db.FinanceYears.AsNoTracking().ToListAsync();
        var entries = await _db.FinanceEntries.AsNoTracking().Include(e => e.Category).ToListAsync();
        var quarterRows = await _db.FinanceQuarters.AsNoTracking().ToListAsync();

        var years = entries.Select(e => e.Date.Year)
            .Concat(yearRows.Select(y => y.Year))
            .Distinct()
            .OrderByDescending(y => y)
            .ToList();

        var result = years.Select(year =>
        {
            var row = yearRows.FirstOrDefault(y => y.Year == year);
            var forYear = entries.Where(e => e.Date.Year == year).ToList();

            return new FinanceYearResponse(
                year,
                row?.MemberCount ?? 0,
                row?.ReserveFund ?? 0m,
                row?.ReportUrl,
                row?.IsPublished ?? true,
                SumOf(forYear, FinanceCategoryType.Income),
                SumOf(forYear, FinanceCategoryType.Expense),
                BuildQuarters(year, forYear, quarterRows.Where(q => q.Year == year).ToList()));
        });

        return Ok(result);
    }

    /// <summary>Create or update the per-year figures that entries cannot supply.</summary>
    [HttpPut("years/{year}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpsertYear(int year, [FromBody] UpsertFinanceYearRequest request)
    {
        if (year < 2000 || year > 2200)
            return BadRequest(new { message = "Godina nije u dozvoljenom opsegu." });

        if (request.MemberCount < 0)
            return BadRequest(new { message = "Broj članova ne može biti negativan." });

        var reportUrl = string.IsNullOrWhiteSpace(request.ReportUrl) ? null : request.ReportUrl.Trim();

        if (reportUrl != null && !Uri.TryCreate(reportUrl, UriKind.Absolute, out _))
            return BadRequest(new { message = "Link ka izveštaju mora biti puna adresa (https://...)." });

        var row = await _db.FinanceYears.FirstOrDefaultAsync(y => y.Year == year);

        if (row == null)
        {
            row = new FinanceYear { Year = year };
            _db.FinanceYears.Add(row);
        }

        row.MemberCount = request.MemberCount;
        row.ReserveFund = request.ReserveFund;
        row.ReportUrl = reportUrl;
        row.IsPublished = request.IsPublished;

        _audit.Record(
            AuditActions.FinanceYearSave, AuditEntityTypes.FinanceYear,
            year.ToString(), year.ToString());

        await _db.SaveChangesAsync();
        return Ok(new { message = "Godina sačuvana." });
    }

    /// <summary>Set the approval status of one quarter.</summary>
    [HttpPut("quarters/{year}/{quarter}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UpsertQuarter(int year, int quarter, [FromBody] UpsertFinanceQuarterRequest request)
    {
        if (quarter < 1 || quarter > 4)
            return BadRequest(new { message = "Kvartal mora biti između 1 i 4." });

        if (!FinanceQuarterStatus.All.Contains(request.Status))
            return BadRequest(new { message = "Nepoznat status kvartala." });

        var row = await _db.FinanceQuarters.FirstOrDefaultAsync(q => q.Year == year && q.Quarter == quarter);

        if (row == null)
        {
            row = new FinanceQuarter { Year = year, Quarter = quarter };
            _db.FinanceQuarters.Add(row);
        }

        row.Status = request.Status;

        // The status is what the action *is*, not a before/after detail, so it
        // belongs in the label — otherwise the row says nothing was set to what.
        _audit.Record(
            AuditActions.FinanceQuarterSetStatus, AuditEntityTypes.FinanceQuarter,
            $"{year}/{quarter}", $"Q{quarter} {year} → {request.Status}");

        await _db.SaveChangesAsync();
        return Ok(new { message = "Status kvartala sačuvan." });
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private static readonly string[] QuarterMonths = { "jan–mar", "apr–jun", "jul–sep", "okt–dec" };

    private async Task<string?> ValidateEntryAsync(int categoryId, decimal amount, string description)
    {
        if (amount <= 0)
            return "Iznos mora biti veći od nule.";

        if (string.IsNullOrWhiteSpace(description))
            return "Opis stavke je obavezan.";

        if (!await _db.FinanceCategories.AnyAsync(c => c.Id == categoryId))
            return "Izabrana kategorija ne postoji.";

        return null;
    }

    /// <summary>
    /// Label an entry carries in the audit trail. Includes the category and the
    /// amount so the row still means something once the entry is deleted.
    /// </summary>
    private static string DescribeEntry(FinanceEntry entry) =>
        $"{entry.Category.Name}: {entry.Amount:0.##} RSD — {entry.Description}";

    private static decimal SumOf(IEnumerable<FinanceEntry> entries, string type) =>
        entries.Where(e => e.Category.Type == type).Sum(e => e.Amount);

    private static List<FinanceBreakdownItemResponse> BuildBreakdown(
        IReadOnlyCollection<FinanceEntry> entries, string type)
    {
        var ofType = entries.Where(e => e.Category.Type == type).ToList();
        var total = ofType.Sum(e => e.Amount);

        // Grouped by id, not by the Category reference: these entries come from
        // a no-tracking query, so each one carries its own Category instance and
        // reference grouping would split a category into one bar per entry.
        return ofType
            .GroupBy(e => e.CategoryId)
            .Select(g => new { Category = g.First().Category, Amount = g.Sum(e => e.Amount) })
            .OrderBy(g => g.Category.DisplayOrder)
            .ThenBy(g => g.Category.Id)
            .Select(g =>
            {
                var amount = g.Amount;

                // Rounded independently per row, so the column can add up to 99
                // or 101. That is how the page has always read.
                var percent = total == 0
                    ? 0
                    : (int)Math.Round(amount / total * 100, MidpointRounding.AwayFromZero);

                return new FinanceBreakdownItemResponse(
                    g.Category.Name, amount, percent, g.Category.Color);
            })
            .ToList();
    }

    private static List<FinanceQuarterResponse> BuildQuarters(
        int year,
        IReadOnlyCollection<FinanceEntry> yearEntries,
        IReadOnlyCollection<FinanceQuarter> quarterRows)
    {
        return Enumerable.Range(1, 4).Select(quarter =>
        {
            var forQuarter = yearEntries
                .Where(e => (e.Date.Month - 1) / 3 + 1 == quarter)
                .ToList();

            var income = SumOf(forQuarter, FinanceCategoryType.Income);
            var expenses = SumOf(forQuarter, FinanceCategoryType.Expense);

            var status = quarterRows.FirstOrDefault(q => q.Quarter == quarter)?.Status
                ?? FinanceQuarterStatus.NotStarted;

            return new FinanceQuarterResponse(
                year,
                quarter,
                $"Q{quarter} {year} ({QuarterMonths[quarter - 1]})",
                income,
                expenses,
                income - expenses,
                forQuarter.Count > 0,
                status);
        }).ToList();
    }

    /// <summary>Income list first, then expenses, each in its own display order.</summary>
    private static List<FinanceCategoryResponse> OrderCategories(IEnumerable<FinanceCategoryResponse> categories) =>
        categories
            .OrderBy(c => c.Type == FinanceCategoryType.Income ? 0 : 1)
            .ThenBy(c => c.DisplayOrder)
            .ThenBy(c => c.Id)
            .ToList();

    private static FinanceCategoryResponse ToResponse(FinanceCategory c, int entryCount) =>
        new(c.Id, c.Name, c.Type, c.Color, c.DisplayOrder, c.IsActive, entryCount);

    private static FinanceEntryResponse ToResponse(FinanceEntry e) =>
        new(e.Id, e.CategoryId, e.Category.Name, e.Category.Type, e.Amount, e.Date,
            e.Description, e.CreatedAt, e.UpdatedAt);
}
