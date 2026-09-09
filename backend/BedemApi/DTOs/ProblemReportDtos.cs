using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

public record CreateProblemReportRequest(
    string? Name,
    string? Email,
    string? Phone,
    string Category,
    string? Location,
    string Message,
    bool Anonymous,
    bool Consent,
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null
);
