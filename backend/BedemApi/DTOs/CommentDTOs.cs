using System.Text.Json.Serialization;

namespace BedemApi.DTOs;

public record CreateCommentRequest(
    string VestSlug,
    string Content,
    // Honeypot. The JSON name has an underscore, which the case-insensitive
    // binder does not treat as equivalent to ContactReference, so the attribute
    // is what makes this bind at all.
    [property: JsonPropertyName("contact_reference")] string? ContactReference = null);

public record CommentResponse(
    int Id,
    string Content,
    string Username,
    DateTime CreatedAt,
    int Likes,
    int Dislikes,
    bool IsApproved,
    bool? UserVote // true=liked, false=disliked, null=no vote
);
