using System.Text.Json;
using BedemApi.Data;
using BedemApi.DTOs;
using BedemApi.Models;
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
    public async Task<IActionResult> GetAll()
    {
        var applications = await _db.MembershipApplications
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(applications);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var application = await _db.MembershipApplications
            .FindAsync(id);

        if (application == null)
            return NotFound();

        return Ok(application);
    }
}