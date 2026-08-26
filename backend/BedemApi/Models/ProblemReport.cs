namespace BedemApi.Models;

public class ProblemReport
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string Category { get; set; } = string.Empty;

    public string? Location { get; set; }

    public string Message { get; set; } = string.Empty;

    public bool Anonymous { get; set; }

    public bool Consent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
