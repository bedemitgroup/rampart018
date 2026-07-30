using System.Security.Claims;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/votes")]
public class VotesController : ControllerBase
{
    private readonly AppDbContext _db;

    public VotesController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Like or dislike a comment. Voting the same way again removes the vote (toggle).</summary>
    [HttpPost("comment")]
    [Authorize]
    [ProducesResponseType(typeof(VoteStatsResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> VoteOnComment([FromBody] VoteRequest request)
    {
        if (request.CommentId == null)
            return BadRequest(new { message = "CommentId is required." });

        var userId = int.Parse(User.FindFirstValue("userId")!);

        var comment = await _db.Comments.FindAsync(request.CommentId.Value);
        if (comment == null || comment.IsDeleted) return NotFound(new { message = "Comment not found." });

        var existing = await _db.Votes
            .FirstOrDefaultAsync(v => v.UserId == userId && v.CommentId == request.CommentId.Value);

        if (existing != null)
        {
            if (existing.IsLike == request.IsLike)
                _db.Votes.Remove(existing); // toggle off
            else
                existing.IsLike = request.IsLike; // change vote
        }
        else
        {
            _db.Votes.Add(new Vote
            {
                UserId = userId,
                CommentId = request.CommentId.Value,
                IsLike = request.IsLike
            });
        }

        await _db.SaveChangesAsync();

        var stats = await GetCommentStats(request.CommentId.Value, userId);
        return Ok(stats);
    }

    /// <summary>Like or dislike an article by slug. Same toggle logic as comment votes.</summary>
    [HttpPost("vest")]
    [Authorize]
    [ProducesResponseType(typeof(VoteStatsResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> VoteOnVest([FromBody] VoteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.VestSlug))
            return BadRequest(new { message = "VestSlug is required." });

        var userId = int.Parse(User.FindFirstValue("userId")!);

        var existing = await _db.Votes
            .FirstOrDefaultAsync(v => v.UserId == userId && v.CommentId == null && v.VestSlug == request.VestSlug);

        if (existing != null)
        {
            if (existing.IsLike == request.IsLike)
                _db.Votes.Remove(existing);
            else
                existing.IsLike = request.IsLike;
        }
        else
        {
            _db.Votes.Add(new Vote
            {
                UserId = userId,
                VestSlug = request.VestSlug,
                IsLike = request.IsLike
            });
        }

        await _db.SaveChangesAsync();

        var stats = await GetVestStats(request.VestSlug, userId);
        return Ok(stats);
    }

    /// <summary>Get like/dislike counts for an article slug, plus the current user's vote if authenticated.</summary>
    [HttpGet("vest/{slug}")]
    [ProducesResponseType(typeof(VoteStatsResponse), 200)]
    public async Task<IActionResult> GetVestVotes(string slug)
    {
        int? currentUserId = null;
        if (User.Identity?.IsAuthenticated == true)
            currentUserId = int.Parse(User.FindFirstValue("userId")!);

        var stats = await GetVestStats(slug, currentUserId);
        return Ok(stats);
    }

    private async Task<VoteStatsResponse> GetCommentStats(int commentId, int? userId)
    {
        var votes = await _db.Votes.Where(v => v.CommentId == commentId).ToListAsync();
        bool? userVote = null;
        if (userId.HasValue)
        {
            var uv = votes.FirstOrDefault(v => v.UserId == userId.Value);
            if (uv != null) userVote = uv.IsLike;
        }
        return new VoteStatsResponse(votes.Count(v => v.IsLike), votes.Count(v => !v.IsLike), userVote);
    }

    private async Task<VoteStatsResponse> GetVestStats(string slug, int? userId)
    {
        var votes = await _db.Votes.Where(v => v.CommentId == null && v.VestSlug == slug).ToListAsync();
        bool? userVote = null;
        if (userId.HasValue)
        {
            var uv = votes.FirstOrDefault(v => v.UserId == userId.Value);
            if (uv != null) userVote = uv.IsLike;
        }
        return new VoteStatsResponse(votes.Count(v => v.IsLike), votes.Count(v => !v.IsLike), userVote);
    }
}
