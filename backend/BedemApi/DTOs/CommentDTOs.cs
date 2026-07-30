namespace BedemApi.DTOs;

public record CreateCommentRequest(string VestSlug, string Content);

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
