using Microsoft.AspNetCore.Authorization;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/problem-reports")]
public class ProblemReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProblemReportsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProblemReportRequest request)
    {
        if (!request.Anonymous && string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Ime je obavezno ili morate izabrati anonimnu prijavu."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email adresa je obavezna."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Category))
        {
            return BadRequest(new
            {
                message = "Kategorija problema je obavezna."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                message = "Opis problema je obavezan."
            });
        }

        if (request.Message.Trim().Length < 30)
        {
            return BadRequest(new
            {
                message = "Opis problema mora imati najmanje 30 karaktera."
            });
        }

        if (!request.Consent)
        {
            return BadRequest(new
            {
                message = "Morate prihvatiti uslove obrade podataka."
            });
        }

        var report = new ProblemReport
        {
            Name = request.Anonymous
                ? null
                : request.Name?.Trim(),

            Email = request.Email.Trim(),

            Phone = request.Phone?.Trim(),

            Category = request.Category.Trim(),

            Location = request.Location?.Trim(),

            Message = request.Message.Trim(),

            Anonymous = request.Anonymous,

            Consent = request.Consent
        };

        _db.ProblemReports.Add(report);

        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = report.Id },
            new
            {
                report.Id,
                report.Category,
                report.Anonymous,
                report.CreatedAt
            });
    }

    [HttpGet]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetAll()
    {
        var reports = await _db.ProblemReports
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(reports);
    }

   [HttpGet("{id}")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> GetById(int id)
    {
        var report = await _db.ProblemReports
            .FindAsync(id);

        if (report == null)
            return NotFound();

        return Ok(report);
    }
}
