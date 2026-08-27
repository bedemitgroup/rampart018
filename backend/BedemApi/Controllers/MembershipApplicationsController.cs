using System.Text.Json;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/membership-applications")]
public class MembershipApplicationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public MembershipApplicationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateMembershipApplicationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.City))
        {
            return BadRequest(new
            {
                message = "Ime, prezime, email i grad su obavezni."
            });
        }

        if (!request.Consent)
        {
            return BadRequest(new
            {
                message = "Morate prihvatiti uslove."
            });
        }

        if (request.FirstName.Length > 100)
        {
            return BadRequest(new
            {
                message = "Ime ne može biti duže od 100 karaktera."
            });
        }

        if (request.LastName.Length > 100)
        {
            return BadRequest(new
            {
                message = "Prezime ne može biti duže od 100 karaktera."
            });
        }

        if (request.Email.Length > 320)
        {
            return BadRequest(new
            {
                message = "Email adresa ne može biti duža od 320 karaktera."
            });
        }

        if (request.Phone?.Length > 30)
        {
            return BadRequest(new
            {
                message = "Telefon ne može biti duži od 30 karaktera."
            });
        }

        if (request.City.Length > 100)
        {
            return BadRequest(new
            {
                message = "Grad ne može biti duži od 100 karaktera."
            });
        }

        if (request.Occupation?.Length > 100)
        {
            return BadRequest(new
            {
                message = "Zanimanje ne može biti duže od 100 karaktera."
            });
        }

        if (request.MembershipType.Length > 50)
        {
            return BadRequest(new
            {
                message = "Tip članstva nije validan."
            });
        }

        if (request.Motivation?.Length > 5000)
        {
            return BadRequest(new
            {
                message = "Motivacija ne može biti duža od 5.000 karaktera."
            });
        }

        if (request.Skills?.Any(skill => skill?.Length > 100) == true)
        {
            return BadRequest(new
            {
                message = "Jedna od veština je predugačka."
            });
        }

        var normalizedSkills = request.Skills
            ?.Where(skill => !string.IsNullOrWhiteSpace(skill))
            .Select(skill => skill.Trim())
            .ToArray();

        var normalizedEmail = ContactNormalizer.NormalizeEmail(request.Email);

        if (!ContactNormalizer.IsValidEmail(normalizedEmail))
        {
            return BadRequest(new
            {
                message = "Unesite ispravnu email adresu."
            });
        }

        if (!ContactNormalizer.TryNormalizePhone(
                request.Phone,
                out var normalizedPhone))
        {
            return BadRequest(new
            {
                message =
                    "Unesite ispravan broj telefona u međunarodnom formatu, npr. +381 64 123 45 67."
            });
        }

        var application = new MembershipApplication
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            Phone = normalizedPhone,
            City = request.City.Trim(),
            Occupation = request.Occupation?.Trim(),
            MembershipType = request.MembershipType.Trim(),
            Motivation = request.Motivation?.Trim(),
            Skills = normalizedSkills is { Length: > 0 }
                ? JsonSerializer.Serialize(normalizedSkills)
                : null,
            Newsletter = request.Newsletter,
            Consent = request.Consent
        };

        _db.MembershipApplications.Add(application);
        await _db.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = application.Id },
            new
            {
                application.Id,
                application.FirstName,
                application.LastName,
                application.Email,
                application.MembershipType,
                application.CreatedAt
            });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Moderator")]
    public async Task<IActionResult> GetAll()
    {
        var applications = await _db.MembershipApplications
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(applications);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Moderator")]
    public async Task<IActionResult> GetById(int id)
    {
        var application = await _db.MembershipApplications
            .FindAsync(id);

        if (application == null)
            return NotFound();

        return Ok(application);
    }
}