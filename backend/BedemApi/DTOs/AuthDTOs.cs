using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

public record RegisterRequest(
    string Username,
    string Email,
    string Password,
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, string Username, string Email, string Role, DateTime ExpiresAt);
