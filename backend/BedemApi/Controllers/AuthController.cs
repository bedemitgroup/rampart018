using System.Security.Claims;
using System.Security.Cryptography;
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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly IHoneypotGuard _honeypot;

    public AuthController(
        AppDbContext db,
        TokenService tokenService,
        IHoneypotGuard honeypot)
    {
        _db = db;
        _tokenService = tokenService;
        _honeypot = honeypot;
    }

    /// <summary>Register a new user account.</summary>
    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.Register)]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // The stored payload is redacted, so the password does not reach the table.
        if (await _honeypot.IsBotAsync(
                HttpContext,
                "register",
                request.ContactReference,
                request))
        {
            // Random bytes, deliberately NOT a signed JWT. A real token for an
            // account that was never created would still satisfy [Authorize] on
            // any endpoint that does not touch a foreign key.
            var decoyToken = Convert.ToBase64String(
                RandomNumberGenerator.GetBytes(48));

            return CreatedAtAction(nameof(Me), new AuthResponse(
                0,
                decoyToken,
                request.Username ?? string.Empty,
                request.Email ?? string.Empty,
                Roles.Visitor,
                DateTime.UtcNow.AddDays(7)));
        }

        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "All fields are required." });

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email already in use." });

        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            return Conflict(new { message = "Username already taken." });

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            // Registering is not membership: a fresh account may comment and
            // like, nothing more. An admin promotes it to Member by hand.
            Role = Roles.Visitor
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return CreatedAtAction(nameof(Me), new AuthResponse(user.Id, token, user.Username, user.Email, user.Role, expiresAt));
    }

    /// <summary>Authenticate and receive a JWT token.</summary>
    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.Login)]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is deactivated." });

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, token, user.Username, user.Email, user.Role, expiresAt));
    }

    /// <summary>Get the currently authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue("userId")!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return Ok(new { user.Id, user.Username, user.Email, user.Role, user.CreatedAt, user.IsActive });
    }
}
