using System.Security.Claims;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/comments")]
public class CommentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHoneypotGuard _honeypot;

    public CommentsController(AppDbContext db, IHoneypotGuard honeypot)
    {
        _db = db;
        _honeypot = honeypot;
    }

    /// <summary>Get comments for a specific article slug. Moderators/Admins also see pending comments.</summary>
    [HttpGet("{vestSlug}")]
    [ProducesResponseType(typeof(IEnumerable<CommentResponse>), 200)]
    public async Task<IActionResult> GetComments(string vestSlug)
    {
        int? currentUserId = null;
        bool isModerator = false;

        if (User.Identity?.IsAuthenticated == true)
        {
            currentUserId = int.Parse(User.FindFirstValue("userId")!);
            isModerator = User.IsIn(Roles.ManageComments);
        }

        var query = _db.Comments
            .Include(c => c.User)
            .Include(c => c.Votes)
            .Where(c => c.VestSlug == vestSlug && !c.IsDeleted);

        if (!isModerator)
            query = query.Where(c => c.IsApproved);

        var comments = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        var result = comments.Select(c =>
        {
            bool? userVote = null;
            if (currentUserId.HasValue)
            {
                var vote = c.Votes.FirstOrDefault(v => v.UserId == currentUserId.Value);
                if (vote != null) userVote = vote.IsLike;
            }

            return new CommentResponse(
                c.Id,
                c.Content,
                c.User.Username,
                c.CreatedAt,
                c.Votes.Count(v => v.IsLike),
                c.Votes.Count(v => !v.IsLike),
                c.IsApproved,
                userVote
            );
        });

        return Ok(result);
    }

    /// <summary>
    /// Create a new comment on an article. Open to every signed-in account,
    /// Visitors included — talking is the one thing a fresh account may do.
    /// Auto-approved for whoever moderates comments.
    /// </summary>
    [HttpPost]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.Comments)]
    [ProducesResponseType(typeof(CommentResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentRequest request)
    {
        // This form sits behind a login, so the account is recorded alongside
        // the address - a bot that bothered to register is worth identifying.
        if (await _honeypot.IsBotAsync(
                HttpContext,
                "comments",
                request.ContactReference,
                request,
                int.Parse(User.FindFirstValue("userId")!)))
        {
            // Mirrors a real pending comment: unapproved, no votes yet.
            var decoy = new CommentResponse(
                IHoneypotGuard.FakeId(),
                request.Content ?? string.Empty,
                User.FindFirstValue("username") ?? string.Empty,
                DateTime.UtcNow,
                0, 0, false, null);

            return CreatedAtAction(
                nameof(GetComments),
                new { vestSlug = request.VestSlug ?? string.Empty },
                decoy);
        }

        if (string.IsNullOrWhiteSpace(request.Content) || string.IsNullOrWhiteSpace(request.VestSlug))
            return BadRequest(new { message = "VestSlug and Content are required." });

        var userId = int.Parse(User.FindFirstValue("userId")!);
        var isAutoApproved = User.IsIn(Roles.ManageComments);

        var comment = new Comment
        {
            Content = request.Content,
            VestSlug = request.VestSlug,
            UserId = userId,
            IsApproved = isAutoApproved
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        await _db.Entry(comment).Reference(c => c.User).LoadAsync();

        var response = new CommentResponse(
            comment.Id, comment.Content, comment.User.Username,
            comment.CreatedAt, 0, 0, comment.IsApproved, null);

        return CreatedAtAction(nameof(GetComments), new { vestSlug = comment.VestSlug }, response);
    }

    /// <summary>Approve a pending comment.</summary>
    [HttpPut("{id}/approve")]
    [Authorize(Roles = Roles.ManageComments)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ApproveComment(int id)
    {
        var comment = await _db.Comments.FindAsync(id);
        if (comment == null || comment.IsDeleted) return NotFound();

        comment.IsApproved = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Comment approved." });
    }

    /// <summary>Soft-delete a comment.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.ManageComments)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _db.Comments.FindAsync(id);
        if (comment == null || comment.IsDeleted) return NotFound();

        comment.IsDeleted = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Comment deleted." });
    }
}
