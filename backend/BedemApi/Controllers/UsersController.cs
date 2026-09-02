using System.Security.Claims;
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
[Authorize(Roles = Roles.ManageUsers)]
public class UsersController : ControllerBase
{
    private const int MinStaffPasswordLength = 8;

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
    /// Create an account outright with the role it is meant to hold. There is no
    /// invite flow — the admin picks the credentials here and hands them over in
    /// person, so the password is never mailed, stored in the clear, or echoed
    /// back by the API.
    /// </summary>
    [HttpPost("staff")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> CreateStaffAccount([FromBody] CreateStaffAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "All fields are required." });

        // Admin is missing from Creatable on purpose: a second admin is made by
        // creating a lesser account and promoting it, so the promotion shows up
        // in the audit log as its own step.
        if (!Roles.Creatable.Contains(request.Role))
            return BadRequest(new
            {
                message = $"Invalid role. Valid values: {string.Join(", ", Roles.Creatable)}."
            });

        // Stricter than public registration on purpose: this account administers.
        if (request.Password.Length < MinStaffPasswordLength)
            return BadRequest(new
            {
                message = $"Password must be at least {MinStaffPasswordLength} characters."
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
            Role = request.Role,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // The role is half of what was created, so it rides in the label.
        await _audit.RecordAsync(
            AuditActions.UserCreateAccount, AuditEntityTypes.User,
            user.Id.ToString(), $"{user.Username} ({user.Role})");

        return Created(
            $"/api/users/{user.Id}",
            new { user.Id, user.Username, user.Email, user.Role, user.IsActive, user.CreatedAt });
    }

    /// <summary>Change a user's role. Valid roles: see <see cref="Roles.All"/>.</summary>
    [HttpPut("{id}/role")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest request)
    {
        if (!Roles.IsKnown(request.Role))
            return BadRequest(new
            {
                message = $"Invalid role. Valid values: {string.Join(", ", Roles.All)}."
            });

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Locking yourself out of the admin panel by demoting your own account
        // would leave the site with no way back in short of a database edit.
        var actorId = int.Parse(User.FindFirstValue("userId")!);
        if (user.Id == actorId && request.Role != Roles.Admin)
            return BadRequest(new { message = "You cannot change your own role." });

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
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        var actorId = int.Parse(User.FindFirstValue("userId")!);
        if (user.Id == actorId)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        user.IsActive = false;

        _audit.Record(
            AuditActions.UserDeactivate, AuditEntityTypes.User,
            user.Id.ToString(), user.Username);

        await _db.SaveChangesAsync();
        return Ok(new { message = "User deactivated." });
    }

    /// <summary>
    /// Let a deactivated account sign in again. The counterpart of
    /// <see cref="DeactivateUser"/> — without it, deactivating is a one-way door
    /// that only a database edit can reopen.
    /// </summary>
    [HttpPut("{id}/activate")]
    [EnableRateLimiting(RateLimitPolicies.AdminWrites)]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = true;

        _audit.Record(
            AuditActions.UserActivate, AuditEntityTypes.User,
            user.Id.ToString(), user.Username);

        await _db.SaveChangesAsync();
        return Ok(new { message = "User activated." });
    }
}

public record ChangeRoleRequest(string Role);

public record CreateStaffAccountRequest(string Username, string Email, string Password, string Role);
