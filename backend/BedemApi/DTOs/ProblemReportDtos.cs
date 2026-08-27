namespace BedemApi.DTOs;

public record CreateProblemReportRequest(
    string? Name,
    string? Email,
    string? Phone,
    string Category,
    string? Location,
    string Message,
    bool Anonymous,
    bool Consent
);
