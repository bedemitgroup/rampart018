using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

/// <summary>
/// Reads the audit trail. Admin only — moderators are the ones being recorded,
/// so they do not get to read the record.
/// </summary>
/// <remarks>
/// Deliberately read-only. There is no endpoint that edits or clears a row: a
/// trail that can be tidied up is not evidence of anything.
/// </remarks>
[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = Roles.ManageUsers)]
public class AuditLogsController : ControllerBase
{
    private const int DefaultPageSize = 25;
    private const int MaxPageSize = 100;

    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// One page of the trail, newest first. Paged on the server rather than in
    /// the browser, unlike the other admin lists: the log only ever grows, so
    /// there is no point at which fetching all of it stops being a problem.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(AuditLogPageResponse), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? actorUserId,
        [FromQuery] string? entityType,
        [FromQuery] string? action,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.AuditLogs.AsNoTracking().AsQueryable();

        if (actorUserId is int actor)
            query = query.Where(a => a.ActorUserId == actor);

        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(a => a.EntityType == entityType);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action == action);

        if (from is DateOnly fromDate)
        {
            var fromUtc = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(a => a.CreatedAt >= fromUtc);
        }

        if (to is DateOnly toDate)
        {
            // Exclusive upper bound on the next day, so "to = today" includes
            // everything logged today rather than only midnight exactly.
            var toUtc = toDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(a => a.CreatedAt < toUtc);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(a =>
                EF.Functions.ILike(a.ActorUsername, pattern) ||
                (a.EntityLabel != null && EF.Functions.ILike(a.EntityLabel, pattern)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .ThenByDescending(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogResponse(
                a.Id, a.ActorUserId, a.ActorUsername, a.ActorRole, a.Action,
                a.EntityType, a.EntityId, a.EntityLabel, a.IpAddress, a.CreatedAt))
            .ToListAsync();

        return Ok(new AuditLogPageResponse(items, total, page, pageSize));
    }

    /// <summary>
    /// The values that actually occur in the log, for the filter dropdowns. Only
    /// these are offered, so a filter can never come back empty by construction.
    /// </summary>
    [HttpGet("filters")]
    [ProducesResponseType(typeof(AuditLogFiltersResponse), 200)]
    public async Task<IActionResult> GetFilters()
    {
        // Distinct over the pair rather than the id alone: a renamed account
        // would otherwise collapse into one entry under whichever name won.
        // Projected to the DTO after materializing — EF cannot order by a
        // property of a constructed record.
        var actorRows = await _db.AuditLogs
            .AsNoTracking()
            .Select(a => new { a.ActorUserId, a.ActorUsername })
            .Distinct()
            .OrderBy(a => a.ActorUsername)
            .ToListAsync();

        var actors = actorRows
            .Select(a => new AuditLogActorResponse(a.ActorUserId, a.ActorUsername))
            .ToList();

        var entityTypes = await _db.AuditLogs
            .AsNoTracking()
            .Select(a => a.EntityType)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();

        var actions = await _db.AuditLogs
            .AsNoTracking()
            .Select(a => a.Action)
            .Distinct()
            .OrderBy(a => a)
            .ToListAsync();

        return Ok(new AuditLogFiltersResponse(actors, entityTypes, actions));
    }
}
