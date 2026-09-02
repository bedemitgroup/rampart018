using BedemApi.Data;
using BedemApi.Models;
using BedemApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private const int MinModeratorPasswordLength = 8;

    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public UsersController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    /// <summary>List all users with their role and status.</summary>
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Select(u => new { u.Id, u.Username, u.Email, u.Role, u.IsActive, u.CreatedAt })
            .OrderBy(u => u.Id)
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Create a moderator account outright. There is no invite flow — the admin
    /// picks the credentials here and hands them over in person, so the password
    /// is never mailed, stored in the clear, or echoed back by the API.
    /// </summary>
    [HttpPost("moderators")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CreateModerator([FromBody] CreateModeratorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "All fields are required." });

        // Stricter than public registration on purpose: this account moderates.
        if (request.Password.Length < MinModeratorPasswordLength)
            return BadRequest(new
            {
                message = $"Password must be at least {MinModeratorPasswordLength} characters."
            });

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email already in use." });

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return Conflict(new { message = "Username already taken." });

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            // Hardcoded, not taken from the request. Promoting someone to Admin
            // stays a separate, deliberate step through ChangeRole below.
            Role = "Moderator",
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _audit.RecordAsync(
            AuditActions.UserCreateModerator, AuditEntityTypes.User,
            user.Id.ToString(), user.Username);

        return Created(
            $"/api/users/{user.Id}",
            new { user.Id, user.Username, user.Email, user.Role, user.IsActive, user.CreatedAt });
    }

    /// <summary>Change a user's role. Valid roles: Admin, Moderator, User.</summary>
    [HttpPut("{id}/role")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest request)
    {
        var validRoles = new[] { "Admin", "Moderator", "User" };
        if (!validRoles.Contains(request.Role))
            return BadRequest(new { message = "Invalid role. Valid values: Admin, Moderator, User." });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = request.Role;

        // The new role is the action itself, so it goes in the label.
        _audit.Record(
            AuditActions.UserChangeRole, AuditEntityTypes.User,
            user.Id.ToString(), $"{user.Username} → {request.Role}");

        await _db.SaveChangesAsync();
        return Ok(new { message = $"Role updated to {request.Role}." });
    }

    /// <summary>Deactivate a user account.</summary>
    [HttpPut("{id}/deactivate")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;

        _audit.Record(
            AuditActions.UserDeactivate, AuditEntityTypes.User,
            user.Id.ToString(), user.Username);

        await _db.SaveChangesAsync();
        return Ok(new { message = "User deactivated." });
    }
}

public record ChangeRoleRequest(string Role);

public record CreateModeratorRequest(string Username, string Email, string Password);
