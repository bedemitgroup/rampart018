using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

/// <summary>
/// The handful of figures the public site is allowed to state about the
/// association.
/// </summary>
/// <remarks>
/// Deliberately a count and nothing else. The roll behind it is the same one
/// the assembly sits on — <see cref="AssemblyEligibility.Roll"/> — so the number
/// on the front page and the number of seats in the chamber can never disagree,
/// which is the whole reason this exists rather than a figure typed into the
/// markup.
/// </remarks>
[ApiController]
[Route("api/stats")]
public class PublicStatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public PublicStatsController(AppDbContext db) => _db = db;

    /// <summary>Public figures. No authentication: this is what the site says about itself.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PublicStatsResponse), 200)]
    public async Task<IActionResult> GetStats()
    {
        var activeMembers = await AssemblyEligibility.Roll(_db).CountAsync();

        return Ok(new PublicStatsResponse(activeMembers));
    }
}
