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
[Route("api/problem-reports")]
public class ProblemReportsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHoneypotGuard _honeypot;

    public ProblemReportsController(AppDbContext db, IHoneypotGuard honeypot)
    {
        _db = db;
        _honeypot = honeypot;
    }

    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.ProblemReports)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> Create(
        [FromBody] CreateProblemReportRequest request)
    {
        // Ahead of validation, so a bot gets the same answer whether or not the
        // rest of its body was well formed. Fields are read defensively here
        // because nothing has been validated yet.
        if (await _honeypot.IsBotAsync(
                HttpContext,
                "problem-reports",
                request.ContactReference,
                request))
        {
            var decoyId = IHoneypotGuard.FakeId();

            return CreatedAtAction(
                nameof(GetById),
                new { id = decoyId },
                new
                {
                    Id = decoyId,
                    Category = request.Category?.Trim() ?? string.Empty,
                    request.Anonymous,
                    CreatedAt = DateTime.UtcNow
                });
        }

        if (!request.Anonymous &&
            string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message =
                    "Ime je obavezno ili morate izabrati anonimnu prijavu."
            });
        }

        if (!request.Anonymous &&
            string.IsNullOrWhiteSpace(request.Email))
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
                message =
                    "Opis problema mora imati najmanje 30 karaktera."
            });
        }

        if (!request.Consent)
        {
            return BadRequest(new
            {
                message =
                    "Morate prihvatiti uslove obrade podataka."
            });
        }

        if (request.Name?.Length > 100)
        {
            return BadRequest(new
            {
                message = "Ime ne može biti duže od 100 karaktera."
            });
        }

        if (request.Email?.Length > 320)
        {
            return BadRequest(new
            {
                message =
                    "Email adresa ne može biti duža od 320 karaktera."
            });
        }

        if (request.Phone?.Length > 30)
        {
            return BadRequest(new
            {
                message =
                    "Telefon ne može biti duži od 30 karaktera."
            });
        }

        if (request.Category.Length > 100)
        {
            return BadRequest(new
            {
                message =
                    "Kategorija ne može biti duža od 100 karaktera."
            });
        }

        if (request.Location?.Length > 200)
        {
            return BadRequest(new
            {
                message =
                    "Lokacija ne može biti duža od 200 karaktera."
            });
        }

        if (request.Message.Length > 10000)
        {
            return BadRequest(new
            {
                message =
                    "Opis problema ne može biti duži od 10.000 karaktera."
            });
        }

        string? normalizedEmail = null;
        string? normalizedPhone = null;

        if (!request.Anonymous)
        {
            normalizedEmail =
                ContactNormalizer.NormalizeEmail(request.Email!);

            if (!ContactNormalizer.IsValidEmail(normalizedEmail))
            {
                return BadRequest(new
                {
                    message =
                        "Unesite ispravnu email adresu."
                });
            }

            if (!ContactNormalizer.TryNormalizePhone(
                    request.Phone,
                    out normalizedPhone))
            {
                return BadRequest(new
                {
                    message =
                        "Unesite ispravan broj telefona u međunarodnom formatu, npr. +381 64 123 45 67."
                });
            }
        }

        var report = new ProblemReport
        {
            Name = request.Anonymous
                ? null
                : request.Name?.Trim(),

            Email = normalizedEmail,

            Phone = normalizedPhone,

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
    [Authorize(Roles = Roles.ViewPanel)]
    public async Task<IActionResult> GetAll()
    {
        var reports = await _db.ProblemReports
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(reports);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = Roles.ViewPanel)]
    public async Task<IActionResult> GetById(int id)
    {
        var report = await _db.ProblemReports
            .FindAsync(id);

        if (report == null)
            return NotFound();

        return Ok(report);
    }
}
