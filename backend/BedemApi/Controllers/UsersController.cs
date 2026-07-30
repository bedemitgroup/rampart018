using BedemApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
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

    /// <summary>Change a user's role. Valid roles: Admin, Moderator, User.</summary>
    [HttpPut("{id}/role")]
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
        await _db.SaveChangesAsync();
        return Ok(new { message = $"Role updated to {request.Role}." });
    }

    /// <summary>Deactivate a user account.</summary>
    [HttpPut("{id}/deactivate")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "User deactivated." });
    }
}

public record ChangeRoleRequest(string Role);
