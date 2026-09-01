using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

public record CreateMembershipApplicationRequest(
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string City,
    string? Occupation,
    string MembershipType,
    string? Motivation,
    string[]? Skills,
    bool Newsletter,
    bool Consent,
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null
);
