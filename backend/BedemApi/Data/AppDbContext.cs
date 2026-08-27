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
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("User");
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

        // Seed admin user
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Username = "admin",
            Email = "admin@bedem.rs",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Role = "Admin",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        });
    }
}
