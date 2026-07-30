namespace BedemApi.DTOs;

public record VoteRequest(string? VestSlug, int? CommentId, bool IsLike);

public record VoteStatsResponse(int Likes, int Dislikes, bool? UserVote);
