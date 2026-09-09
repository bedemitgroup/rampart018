using BedemApi.Data;
using BedemApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/bot-submissions")]
[Authorize(Roles = Roles.ManageSubmissions)]
public class BotSubmissionsController : ControllerBase
{
    private const int DefaultTake = 100;
    private const int MaxTake = 500;

    private readonly AppDbContext _db;

    public BotSubmissionsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Submissions caught by the honeypot, newest first.</summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetAll([FromQuery] int take = DefaultTake)
    {
        var submissions = await _db.BotSubmissions
            .OrderByDescending(x => x.CreatedAt)
            .Take(Math.Clamp(take, 1, MaxTake))
            .ToListAsync();

        return Ok(submissions);
    }
}
