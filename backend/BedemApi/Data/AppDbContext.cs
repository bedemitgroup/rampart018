using BedemApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Vote> Votes => Set<Vote>();
    public DbSet<News> News => Set<News>();
    public DbSet<MembershipApplication> MembershipApplications => Set<MembershipApplication>();
    public DbSet<ProblemReport> ProblemReports => Set<ProblemReport>();
    public DbSet<BotSubmission> BotSubmissions => Set<BotSubmission>();
    public DbSet<FinanceCategory> FinanceCategories => Set<FinanceCategory>();
    public DbSet<FinanceEntry> FinanceEntries => Set<FinanceEntry>();
    public DbSet<FinanceYear> FinanceYears => Set<FinanceYear>();
    public DbSet<FinanceQuarter> FinanceQuarters => Set<FinanceQuarter>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AssemblySession> AssemblySessions => Set<AssemblySession>();
    public DbSet<AssemblyAttendance> AssemblyAttendances => Set<AssemblyAttendance>();
    public DbSet<AssemblyTopic> AssemblyTopics => Set<AssemblyTopic>();
    public DbSet<AssemblyVote> AssemblyVotes => Set<AssemblyVote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Role).HasDefaultValue(Roles.Visitor);
        });

        // Comment -> User
        modelBuilder.Entity<Comment>(e =>
        {
            e.HasOne(c => c.User)
             .WithMany(u => u.Comments)
             .HasForeignKey(c => c.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(c => c.VestSlug);
        });

        // Vote
        modelBuilder.Entity<Vote>(e =>
        {
            e.HasOne(v => v.User)
             .WithMany(u => u.Votes)
             .HasForeignKey(v => v.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(v => v.Comment)
             .WithMany(c => c.Votes)
             .HasForeignKey(v => v.CommentId)
             .OnDelete(DeleteBehavior.Cascade)
             .IsRequired(false);

            // One vote per user per comment
            e.HasIndex(v => new { v.UserId, v.CommentId })
             .IsUnique()
             .HasFilter("\"CommentId\" IS NOT NULL");

            // One vote per user per article (vest) – only when CommentId is null
            e.HasIndex(v => new { v.UserId, v.VestSlug })
             .IsUnique()
             .HasFilter("\"CommentId\" IS NULL AND \"VestSlug\" != ''");
        });

        // News -> User (author)
        modelBuilder.Entity<News>(e =>
        {
            e.HasIndex(n => n.Slug).IsUnique();

            e.HasOne(n => n.AuthorUser)
             .WithMany()
             .HasForeignKey(n => n.AuthorUserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Honeypot hits. No relationship to User on purpose - this is evidence,
        // and it must outlive the account that produced it.
        modelBuilder.Entity<BotSubmission>(e =>
        {
            e.HasIndex(b => b.CreatedAt);
            e.HasIndex(b => b.IpAddress);
        });

        // Finance
        modelBuilder.Entity<FinanceCategory>(e =>
        {
            e.HasIndex(c => new { c.Type, c.DisplayOrder });
        });

        modelBuilder.Entity<FinanceEntry>(e =>
        {
            e.Property(x => x.Amount).HasPrecision(18, 2);

            // Restrict on both sides: an entry is a booked figure, so neither
            // retiring a category nor deleting a user may quietly erase it.
            e.HasOne(x => x.Category)
             .WithMany(c => c.Entries)
             .HasForeignKey(x => x.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedByUser)
             .WithMany()
             .HasForeignKey(x => x.CreatedByUserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.Date);
        });

        modelBuilder.Entity<FinanceYear>(e =>
        {
            e.HasIndex(y => y.Year).IsUnique();
            e.Property(y => y.ReserveFund).HasPrecision(18, 2);
        });

        modelBuilder.Entity<FinanceQuarter>(e =>
        {
            e.HasIndex(q => new { q.Year, q.Quarter }).IsUnique();
        });

        // Audit trail. Like BotSubmission, no relationship to User on purpose:
        // the record of what an account did must outlive the account.
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasIndex(a => a.CreatedAt);
            e.HasIndex(a => a.ActorUserId);
            e.HasIndex(a => new { a.EntityType, a.EntityId });
        });

        // Skupština
        modelBuilder.Entity<AssemblySession>(e =>
        {
            e.HasOne(x => x.CreatedByUser)
             .WithMany()
             .HasForeignKey(x => x.CreatedByUserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.ScheduledAt);

            // At most one sitting may be in progress. The hall, the presence
            // tracker and "which session am I in" all assume it, so the schema
            // states it once instead of four controller guards that can drift.
            e.HasIndex(x => x.Status)
             .IsUnique()
             .HasDatabaseName("IX_AssemblySessions_SingleInProgress")
             .HasFilter($"\"Status\" = '{AssemblySessionStatus.InProgress}'");
        });

        modelBuilder.Entity<AssemblyAttendance>(e =>
        {
            // Cascade is right here and only here: an RSVP is an intention
            // about one sitting and means nothing without it.
            e.HasOne(x => x.Session)
             .WithMany(s => s.Attendances)
             .HasForeignKey(x => x.SessionId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.SessionId, x.UserId }).IsUnique();
        });

        modelBuilder.Entity<AssemblyTopic>(e =>
        {
            // Restrict, not Cascade, and deliberately so: a topic that has been
            // voted on is a record of a decision, and deleting the sitting it
            // hung on must not take the ballots with it — the same principle
            // the AuditLog block below states. The controller refuses first,
            // with a sentence; this is the net under that rule.
            e.HasOne(x => x.Session)
             .WithMany(s => s.Topics)
             .HasForeignKey(x => x.SessionId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.ProposedByUser)
             .WithMany()
             .HasForeignKey(x => x.ProposedByUserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.ReviewedByUser)
             .WithMany()
             .HasForeignKey(x => x.ReviewedByUserId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.SessionId, x.DisplayOrder });
            e.HasIndex(x => x.Status);
        });

        modelBuilder.Entity<AssemblyVote>(e =>
        {
            // Same reasoning as the topic edge: a cast ballot outlives the row
            // it hangs on. An open ballot is dropped explicitly, row by row.
            e.HasOne(x => x.Topic)
             .WithMany(t => t.Votes)
             .HasForeignKey(x => x.TopicId)
             .OnDelete(DeleteBehavior.Restrict);

            // .WithMany() with no navigation on User: it already carries an
            // ICollection<Vote> for news likes, and a second collection beside
            // it would only invite the two to be confused.
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.TopicId, x.UserId }).IsUnique();
        });

        FinanceSeed.Apply(modelBuilder);

        // Seed admin user
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "admin",
            Email = "admin@bedem.rs",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = Roles.Admin,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        });
    }
}
