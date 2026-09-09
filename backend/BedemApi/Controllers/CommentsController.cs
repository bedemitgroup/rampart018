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
    /// <summary>How long a comment ban lasts. One knob, so the button label,
    /// the audit line and the enforced date can never disagree.</summary>
    private const int CommentBanDays = 10;

    private readonly AppDbContext _db;
    private readonly IHoneypotGuard _honeypot;
    private readonly IAuditLogger _audit;

    public CommentsController(AppDbContext db, IHoneypotGuard honeypot, IAuditLogger audit)
    {
        _db = db;
        _honeypot = honeypot;
        _audit = audit;
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
                userVote,
                // Author identity is a moderator-only field: a signed-in reader
                // has no business knowing which account id wrote what.
                isModerator ? c.UserId : null,
                isModerator ? c.User.Role : null,
                isModerator ? c.User.CommentBannedUntil : null
            );
        });

        return Ok(result);
    }

    /// <summary>
    /// Every pending comment across every article, for the moderation panel.
    /// Deleted ones are already gone; this is the approve-or-bin queue.
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Roles = Roles.ManageComments)]
    [ProducesResponseType(typeof(IEnumerable<PendingCommentResponse>), 200)]
    public async Task<IActionResult> GetPending()
    {
        var pending = await _db.Comments
            .Include(c => c.User)
            .Where(c => !c.IsApproved && !c.IsDeleted)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Content,
                Username = c.User.Username,
                c.CreatedAt,
                c.VestSlug,
                c.UserId,
                AuthorRole = c.User.Role,
                AuthorBannedUntil = c.User.CommentBannedUntil,
            })
            .ToListAsync();

        var slugs = pending.Select(c => c.VestSlug).Distinct().ToList();
        var titles = await _db.News
            .Where(n => slugs.Contains(n.Slug))
            .ToDictionaryAsync(n => n.Slug, n => n.Title);

        var result = pending.Select(c => new PendingCommentResponse(
            c.Id,
            c.Content,
            c.Username,
            c.CreatedAt,
            c.VestSlug,
            titles.TryGetValue(c.VestSlug, out var t) ? t : null,
            c.UserId,
            c.AuthorRole,
            c.AuthorBannedUntil));

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

        // A comment ban is the whole point of this check: while it is in the
        // future the account may sign in and read, but not post.
        var author = await _db.Users.FindAsync(userId);
        if (author is null) return Unauthorized();
        if (author.CommentBannedUntil is { } until && until > DateTime.UtcNow)
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = $"Privremeno vam je onemogućeno komentarisanje do {until:dd.MM.yyyy}."
            });

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

    /// <summary>
    /// Bar an account from posting comments for <see cref="CommentBanDays"/> days.
    /// The moderator reaches for this from the pending queue when someone posts
    /// something against the rules: delete the comment, bar the person. The
    /// account is otherwise untouched — it still signs in, votes and reads.
    /// </summary>
    [HttpPost("users/{userId}/ban")]
    [Authorize(Roles = Roles.ManageComments)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(BanCommenterResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> BanCommenter(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        var actorId = int.Parse(User.FindFirstValue("userId")!);
        if (user.Id == actorId)
            return BadRequest(new { message = "Ne možete banovati sami sebe." });

        // Staff are not silenced with a comment ban — if one of them is a
        // problem, that is a role decision for an Admin, and a heavier one.
        if (Roles.Staff.Split(',').Contains(user.Role))
            return BadRequest(new { message = "Nalog sa ulogom ne može biti banovan ovim putem." });

        user.CommentBannedUntil = DateTime.UtcNow.AddDays(CommentBanDays);

        _audit.Record(
            AuditActions.CommentBanUser, AuditEntityTypes.User,
            user.Id.ToString(), $"{user.Username} (do {user.CommentBannedUntil:dd.MM.yyyy})");

        await _db.SaveChangesAsync();

        return Ok(new BanCommenterResponse(
            $"Korisnik {user.Username} ne može da komentariše do {user.CommentBannedUntil:dd.MM.yyyy}.",
            user.CommentBannedUntil));
    }

    /// <summary>Lift a comment ban early. The counterpart of
    /// <see cref="BanCommenter"/>.</summary>
    [HttpPost("users/{userId}/unban")]
    [Authorize(Roles = Roles.ManageComments)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(BanCommenterResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UnbanCommenter(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (user.CommentBannedUntil == null)
            return Ok(new BanCommenterResponse($"Korisnik {user.Username} nije banovan.", null));

        user.CommentBannedUntil = null;

        _audit.Record(
            AuditActions.CommentUnbanUser, AuditEntityTypes.User,
            user.Id.ToString(), user.Username);

        await _db.SaveChangesAsync();

        return Ok(new BanCommenterResponse($"Ban za korisnika {user.Username} je skinut.", null));
    }
}
