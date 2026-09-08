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

/// <summary>
/// The single "aktuelno" line on the front page. Anyone reads it; a Moderator
/// edits it from the news panel.
/// </summary>
[ApiController]
[Route("api/site-notice")]
public class SiteNoticeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public SiteNoticeController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    /// <summary>The current notice text.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteNoticeResponse), 200)]
    public async Task<IActionResult> Get()
    {
        var notice = await _db.SiteNotices.AsNoTracking().OrderBy(x => x.Id).FirstAsync();
        return Ok(new SiteNoticeResponse(notice.Text, notice.UpdatedAt));
    }

    /// <summary>Replace the notice text.</summary>
    [HttpPut]
    [Authorize(Roles = Roles.ManageNews)]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(typeof(SiteNoticeResponse), 200)]
    public async Task<IActionResult> Update([FromBody] UpdateSiteNoticeRequest request)
    {
        var text = (request.Text ?? string.Empty).Trim();

        var notice = await _db.SiteNotices.OrderBy(x => x.Id).FirstAsync();
        notice.Text = text;
        notice.UpdatedAt = DateTime.UtcNow;
        notice.UpdatedByUserId = int.Parse(User.FindFirstValue("userId")!);

        _audit.Record(AuditActions.NewsNoticeUpdate, AuditEntityTypes.News, null, "Traka „Aktuelno\"");

        await _db.SaveChangesAsync();

        return Ok(new SiteNoticeResponse(notice.Text, notice.UpdatedAt));
    }
}
