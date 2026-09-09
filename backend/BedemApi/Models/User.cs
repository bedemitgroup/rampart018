namespace BedemApi.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    // Self-registration lands here; see Roles for what each one may do.
    public string Role { get; set; } = Roles.Visitor;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Set by a Moderator/Admin when this account breaks the comment rules. While
    // it sits in the future, CreateComment refuses. Null — or a past date —
    // means the account may comment normally. A comment ban is narrower than
    // IsActive: the account can still sign in, vote and read.
    public DateTime? CommentBannedUntil { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
