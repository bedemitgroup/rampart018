namespace BedemApi.Models;

public class MembershipApplication
{
    public int Id { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string City { get; set; } = string.Empty;
    public string? Occupation { get; set; }

    public string MembershipType { get; set; } = "redovni";

    public string? Motivation { get; set; }

    public string? Skills { get; set; }

    public bool Newsletter { get; set; } = true;
    public bool Consent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}