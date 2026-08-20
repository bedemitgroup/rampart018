namespace BedemApi.DTOs;

public record CreateNewsRequest(string Title, string Excerpt, string Body, string Category, string AuthorName, string? ImageUrl, string? SourceUrl, bool IsPublished);

public record UpdateNewsRequest(string Title, string Excerpt, string Body, string Category, string AuthorName, string? ImageUrl, string? SourceUrl, bool IsPublished);

public record NewsListItemResponse(
    int Id,
    string Slug,
    string Title,
    string Excerpt,
    string Category,
    string? ImageUrl,
    string AuthorName,
    DateTime CreatedAt,
    bool IsPublished
);

public record NewsDetailResponse(
    int Id,
    string Slug,
    string Title,
    string Excerpt,
    string Body,
    string Category,
    string? ImageUrl,
    string AuthorName,
    string? SourceUrl,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    bool IsPublished
);
