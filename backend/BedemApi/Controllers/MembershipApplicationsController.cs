using System.Text.Json;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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

if (request.Skills?.Any(skill => skill.Length > 100) == true)
{
    return BadRequest(new
    {
        message = "Jedna od veština je predugačka."
    });
}

        var application = new MembershipApplication
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone?.Trim(),
            City = request.City.Trim(),
            Occupation = request.Occupation?.Trim(),
            MembershipType = request.MembershipType,
            Motivation = request.Motivation?.Trim(),
            Skills = request.Skills == null
                ? null
                : JsonSerializer.Serialize(request.Skills),
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