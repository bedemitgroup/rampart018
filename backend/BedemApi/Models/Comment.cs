namespace BedemApi.Models;

public class Comment
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsApproved { get; set; } = false;
    public bool IsDeleted { get; set; } = false;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string VestSlug { get; set; } = string.Empty;
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
