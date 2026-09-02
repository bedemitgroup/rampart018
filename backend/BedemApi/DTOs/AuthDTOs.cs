using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

public record RegisterRequest(
    string Username,
    string Email,
    string Password,
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null);

public record LoginRequest(string Email, string Password);

// Id is here because the client needs to know which row is its own - the
// assembly hall is built entirely on "which seat is mine". Without it user.id
// stays undefined until the next page load, when /me finally supplies it.
public record AuthResponse(int Id, string Token, string Username, string Email, string Role, DateTime ExpiresAt);
