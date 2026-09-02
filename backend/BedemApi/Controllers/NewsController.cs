using System.Security.Claims;
using System.Text.RegularExpressions;
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
[Route("api/news")]
public class NewsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public NewsController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    private bool IsModerator => User.Identity?.IsAuthenticated == true &&
        (User.IsInRole("Moderator") || User.IsInRole("Admin"));

    /// <summary>List news. Moderators/Admins also see unpublished drafts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NewsListItemResponse>), 200)]
    public async Task<IActionResult> GetAll()
    {
        var query = _db.News.AsQueryable();

        if (!IsModerator)
            query = query.Where(n => n.IsPublished);

        var news = await query.OrderBy(n => n.DisplayOrder).ThenByDescending(n => n.CreatedAt).ToListAsync();

        var result = news.Select(n => new NewsListItemResponse(
            n.Id, n.Slug, n.Title, n.Excerpt, n.Category, n.ImageUrl,
            n.AuthorName, n.CreatedAt, n.IsPublished));

        return Ok(result);
    }

    /// <summary>Get a single news article by slug.</summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(NewsDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var n = await _db.News.FirstOrDefaultAsync(x => x.Slug == slug);
        if (n == null || (!n.IsPublished && !IsModerator)) return NotFound();

        return Ok(new NewsDetailResponse(
            n.Id, n.Slug, n.Title, n.Excerpt, n.Body, n.Category, n.ImageUrl,
            n.AuthorName, n.SourceUrl, n.CreatedAt, n.UpdatedAt, n.IsPublished));
    }

    /// <summary>Create a new news article.</summary>
    [HttpPost]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(NewsDetailResponse), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreateNewsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Excerpt) ||
            string.IsNullOrWhiteSpace(request.Body) ||
            string.IsNullOrWhiteSpace(request.Category) ||
            string.IsNullOrWhiteSpace(request.AuthorName))
            return BadRequest(new { message = "Title, Excerpt, Body, Category and AuthorName are required." });

        var userId = int.Parse(User.FindFirstValue("userId")!);

        var news = new News
        {
            Slug = await GenerateUniqueSlugAsync(request.Title),
            Title = request.Title,
            Excerpt = request.Excerpt,
            Body = request.Body,
            Category = request.Category,
            AuthorName = request.AuthorName,
            ImageUrl = request.ImageUrl,
            SourceUrl = request.SourceUrl,
            IsPublished = request.IsPublished,
            AuthorUserId = userId
        };

        _db.News.Add(news);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(
            AuditActions.NewsCreate, AuditEntityTypes.News, news.Id.ToString(), news.Title);

        var response = new NewsDetailResponse(
            news.Id, news.Slug, news.Title, news.Excerpt, news.Body, news.Category, news.ImageUrl,
            news.AuthorName, news.SourceUrl, news.CreatedAt, news.UpdatedAt, news.IsPublished);

        return CreatedAtAction(nameof(GetBySlug), new { slug = news.Slug }, response);
    }

    /// <summary>Update an existing news article. The slug never changes.</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNewsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Excerpt) ||
            string.IsNullOrWhiteSpace(request.Body) ||
            string.IsNullOrWhiteSpace(request.Category) ||
            string.IsNullOrWhiteSpace(request.AuthorName))
            return BadRequest(new { message = "Title, Excerpt, Body, Category and AuthorName are required." });

        var news = await _db.News.FirstOrDefaultAsync(x => x.Id == id);
        if (news == null) return NotFound();

        var wasPublished = news.IsPublished;

        news.Title = request.Title;
        news.Excerpt = request.Excerpt;
        news.Body = request.Body;
        news.Category = request.Category;
        news.AuthorName = request.AuthorName;
        news.ImageUrl = request.ImageUrl;
        news.SourceUrl = request.SourceUrl;
        news.IsPublished = request.IsPublished;
        news.UpdatedAt = DateTime.UtcNow;

        // Toggling publication is the change an admin actually looks for, so it
        // gets its own action rather than hiding inside a generic update.
        var action = news.IsPublished == wasPublished
            ? AuditActions.NewsUpdate
            : news.IsPublished ? AuditActions.NewsPublish : AuditActions.NewsUnpublish;

        _audit.Record(action, AuditEntityTypes.News, news.Id.ToString(), news.Title);

        await _db.SaveChangesAsync();

        var response = new NewsDetailResponse(
            news.Id, news.Slug, news.Title, news.Excerpt, news.Body, news.Category, news.ImageUrl,
            news.AuthorName, news.SourceUrl, news.CreatedAt, news.UpdatedAt, news.IsPublished);

        return Ok(response);
    }

    /// <summary>Delete a news article.</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id)
    {
        var news = await _db.News.FindAsync(id);
        if (news == null) return NotFound();

        _audit.Record(
            AuditActions.NewsDelete, AuditEntityTypes.News, news.Id.ToString(), news.Title);

        _db.News.Remove(news);
        await _db.SaveChangesAsync();
        return Ok(new { message = "News deleted." });
    }

    /// <summary>Move a news article up or down in the display order. Returns the full reordered list.</summary>
    [HttpPut("{id}/move")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(IEnumerable<NewsListItemResponse>), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Move(int id, [FromBody] MoveNewsRequest request)
    {
        if (request.Direction != "up" && request.Direction != "down")
            return BadRequest(new { message = "Direction must be 'up' or 'down'." });

        var ordered = await _db.News
            .OrderBy(n => n.DisplayOrder)
            .ThenByDescending(n => n.CreatedAt)
            .ToListAsync();

        for (int i = 0; i < ordered.Count; i++)
            ordered[i].DisplayOrder = i;

        var index = ordered.FindIndex(n => n.Id == id);
        if (index == -1) return NotFound();

        var targetIndex = request.Direction == "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= ordered.Count)
            return BadRequest(new { message = "Vest je već na kraju u tom pravcu." });

        (ordered[index].DisplayOrder, ordered[targetIndex].DisplayOrder) =
            (ordered[targetIndex].DisplayOrder, ordered[index].DisplayOrder);

        _audit.Record(
            request.Direction == "up" ? AuditActions.NewsMoveUp : AuditActions.NewsMoveDown,
            AuditEntityTypes.News,
            ordered[index].Id.ToString(),
            ordered[index].Title);

        await _db.SaveChangesAsync();

        var result = ordered
            .OrderBy(n => n.DisplayOrder)
            .Select(n => new NewsListItemResponse(
                n.Id, n.Slug, n.Title, n.Excerpt, n.Category, n.ImageUrl,
                n.AuthorName, n.CreatedAt, n.IsPublished));

        return Ok(result);
    }

    /// <summary>Upload an image to attach to a news article. Returns its public URL.</summary>
    [HttpPost("upload-image")]
    [Authorize(Roles = "Moderator,Admin")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [RequestSizeLimit(5 * 1024 * 1024)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExt.Contains(ext))
            return BadRequest(new { message = "Unsupported file type." });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "news");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        return Ok(new { url = $"/uploads/news/{fileName}" });
    }

    private static readonly Dictionary<char, char> DiacriticsMap = new()
    {
        { 'č', 'c' }, { 'ć', 'c' }, { 'đ', 'd' }, { 'š', 's' }, { 'ž', 'z' }
    };

    private static string Slugify(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = new string(slug.Select(c => DiacriticsMap.TryGetValue(c, out var r) ? r : c).ToArray());
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }

    private async Task<string> GenerateUniqueSlugAsync(string title)
    {
        var baseSlug = Slugify(title);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "vest";

        var slug = baseSlug;
        var suffix = 2;
        while (await _db.News.AnyAsync(n => n.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }
        return slug;
    }
}
