namespace BedemApi.Models;

/// <summary>
/// Every action the audit log can record. The log stores the action name only —
/// no before/after values — so the names are deliberately granular: turning a
/// news article off is <see cref="NewsUnpublish"/> rather than a generic update,
/// because "Marko ugasio vest" has to be answerable from the name alone.
/// </summary>
public static class AuditActions
{
    // News
    public const string NewsCreate = "News.Create";
    public const string NewsUpdate = "News.Update";
    public const string NewsPublish = "News.Publish";
    public const string NewsUnpublish = "News.Unpublish";
    public const string NewsDelete = "News.Delete";
    public const string NewsMoveUp = "News.MoveUp";
    public const string NewsMoveDown = "News.MoveDown";

    // Finance — entries
    public const string FinanceEntryCreate = "Finance.Entry.Create";
    public const string FinanceEntryUpdate = "Finance.Entry.Update";
    public const string FinanceEntryDelete = "Finance.Entry.Delete";

    // Finance — categories
    public const string FinanceCategoryCreate = "Finance.Category.Create";
    public const string FinanceCategoryUpdate = "Finance.Category.Update";
    public const string FinanceCategoryDelete = "Finance.Category.Delete";
    public const string FinanceCategoryMoveUp = "Finance.Category.MoveUp";
    public const string FinanceCategoryMoveDown = "Finance.Category.MoveDown";

    // Finance — years and quarters
    public const string FinanceYearSave = "Finance.Year.Save";
    public const string FinanceQuarterSetStatus = "Finance.Quarter.SetStatus";

    // Skupstina - sessions
    public const string AssemblySessionCreate = "Assembly.Session.Create";
    public const string AssemblySessionUpdate = "Assembly.Session.Update";
    public const string AssemblySessionOpen = "Assembly.Session.Open";
    public const string AssemblySessionClose = "Assembly.Session.Close";
    public const string AssemblySessionCancel = "Assembly.Session.Cancel";
    public const string AssemblySessionDelete = "Assembly.Session.Delete";

    // Accounts
    public const string UserCreateAccount = "User.CreateAccount";

    /// <summary>
    /// Superseded by <see cref="UserCreateAccount"/> once accounts could be
    /// created with any staff role. Kept so old rows still render a label.
    /// </summary>
    public const string UserCreateModerator = "User.CreateModerator";
    public const string UserChangeRole = "User.ChangeRole";
    public const string UserDeactivate = "User.Deactivate";
    public const string UserActivate = "User.Activate";

    public static readonly IReadOnlyList<string> All = new[]
    {
        NewsCreate, NewsUpdate, NewsPublish, NewsUnpublish, NewsDelete,
        NewsMoveUp, NewsMoveDown,
        FinanceEntryCreate, FinanceEntryUpdate, FinanceEntryDelete,
        FinanceCategoryCreate, FinanceCategoryUpdate, FinanceCategoryDelete,
        FinanceCategoryMoveUp, FinanceCategoryMoveDown,
        FinanceYearSave, FinanceQuarterSetStatus,
        AssemblySessionCreate, AssemblySessionUpdate, AssemblySessionOpen,
        AssemblySessionClose, AssemblySessionCancel, AssemblySessionDelete,
        UserCreateAccount, UserCreateModerator, UserChangeRole,
        UserDeactivate, UserActivate
    };
}

/// <summary>
/// The kinds of thing an audited action can target. Used as the entity filter
/// on the admin page, so it is coarser than <see cref="AuditActions"/>.
/// </summary>
public static class AuditEntityTypes
{
    public const string News = "News";
    public const string FinanceEntry = "FinanceEntry";
    public const string FinanceCategory = "FinanceCategory";
    public const string FinanceYear = "FinanceYear";
    public const string FinanceQuarter = "FinanceQuarter";
    public const string User = "User";
    public const string AssemblySession = "AssemblySession";

    public static readonly IReadOnlyList<string> All = new[]
    {
        News, FinanceEntry, FinanceCategory, FinanceYear, FinanceQuarter,
        AssemblySession, User
    };
}
