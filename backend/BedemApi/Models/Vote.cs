namespace BedemApi.Models;

public class Vote
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int? CommentId { get; set; }
    public Comment? Comment { get; set; }
    public string VestSlug { get; set; } = string.Empty;
    public bool IsLike { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
