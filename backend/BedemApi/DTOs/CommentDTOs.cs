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
    bool? UserVote, // true=liked, false=disliked, null=no vote
    // The next three are filled only for a moderator/admin viewing the thread —
    // everyone else gets null. They are what the inline "ban this commenter"
    // button needs: who the author is, whether barring him is even allowed
    // (staff are not banned, their role is), and whether he already is barred.
    int? AuthorUserId = null,
    string? AuthorRole = null,
    DateTime? AuthorBannedUntil = null
);

/// <summary>
/// A pending comment as the admin panel lists it: no vote counts, but it carries
/// which article it is waiting on so a moderator can clear the whole queue from
/// one place.
/// </summary>
public record PendingCommentResponse(
    int Id,
    string Content,
    string Username,
    DateTime CreatedAt,
    string VestSlug,
    string? VestTitle,
    // The author, so the queue can bar him in one click, plus his role (staff
    // are not banned) and whether he is already barred.
    int AuthorUserId,
    string AuthorRole,
    DateTime? AuthorBannedUntil
);

public record BanCommenterResponse(string Message, DateTime? BannedUntil);
