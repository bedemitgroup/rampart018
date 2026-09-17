using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
    // Stricter than public registration on purpose: these accounts already
    // exist and are protecting themselves, not signing up for the first time.
    private const int MinPasswordLength = 8;

    private readonly AppDbContext _db;
    private readonly TokenService _tokenService;
    private readonly IHoneypotGuard _honeypot;
    private readonly IAuditLogger _audit;
    private readonly string _passwordChangeCode;

    public AuthController(
        AppDbContext db,
        TokenService tokenService,
        IHoneypotGuard honeypot,
        IAuditLogger audit,
        IConfiguration config)
    {
        _db = db;
        _tokenService = tokenService;
        _honeypot = honeypot;
        _audit = audit;
        // Presence is already enforced at startup (Program.cs) - see there.
        _passwordChangeCode = config["AccountSecurity:PasswordChangeCode"]!;
    }

    /// <summary>
    /// Constant-time so a caller cannot learn the code one byte at a time by
    /// timing repeated attempts.
    /// </summary>
    private bool IsValidChangeCode(string? code)
    {
        var supplied = Encoding.UTF8.GetBytes(code ?? string.Empty);
        var expected = Encoding.UTF8.GetBytes(_passwordChangeCode);
        return CryptographicOperations.FixedTimeEquals(supplied, expected);
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

    /// <summary>Change the current user's own password.</summary>
    [HttpPut("password")]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.AccountSecurity)]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "All fields are required." });

        if (request.NewPassword.Length < MinPasswordLength)
            return BadRequest(new
            {
                message = $"Password must be at least {MinPasswordLength} characters."
            });

        if (!IsValidChangeCode(request.ChangeCode))
            return Unauthorized(new { message = "Nevažeći kod za promenu." });

        // userId always comes from the token, never from the body - a caller
        // can only ever change their own password.
        var userId = int.Parse(User.FindFirstValue("userId")!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Unauthorized(new { message = "Pogrešna trenutna lozinka." });

        if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash))
            return BadRequest(new { message = "Nova lozinka mora biti različita od trenutne." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        // Every other token this account holds - on any other device - stops
        // working on its next request. This session gets a fresh one below.
        user.SecurityStamp = Guid.NewGuid().ToString("N");

        _audit.Record(AuditActions.UserChangeOwnPassword, AuditEntityTypes.User, user.Id.ToString(), user.Username);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, token, user.Username, user.Email, user.Role, expiresAt));
    }

    /// <summary>
    /// Change the current user's own display username. Lower-stakes than the
    /// password/email endpoints - it is not a login credential (login is by
    /// email) or a recovery path, just the name attached to comments, votes
    /// and audit rows going forward - so it skips the change code and does not
    /// rotate SecurityStamp. It still asks for the current password (a member
    /// away from an unlocked session should not have it renamed under them)
    /// and reissues the token so the "username" claim is not stale.
    /// </summary>
    [HttpPut("username")]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.AccountSecurity)]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> ChangeUsername([FromBody] ChangeUsernameRequest request)
    {
        var newUsername = request.NewUsername?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(newUsername))
            return BadRequest(new { message = "All fields are required." });

        var userId = int.Parse(User.FindFirstValue("userId")!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Unauthorized(new { message = "Pogrešna trenutna lozinka." });

        if (await _db.Users.AnyAsync(u => u.Username == newUsername && u.Id != userId))
            return Conflict(new { message = "Username already taken." });

        var oldUsername = user.Username;
        user.Username = newUsername;

        _audit.Record(
            AuditActions.UserChangeOwnUsername, AuditEntityTypes.User,
            user.Id.ToString(), $"{oldUsername} → {newUsername}");
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, token, user.Username, user.Email, user.Role, expiresAt));
    }

    /// <summary>Change the current user's own email address.</summary>
    [HttpPut("email")]
    [Authorize]
    [EnableRateLimiting(RateLimitPolicies.AccountSecurity)]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(409)]
    [ProducesResponseType(429)]
    public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewEmail))
            return BadRequest(new { message = "All fields are required." });

        var normalizedEmail = ContactNormalizer.NormalizeEmail(request.NewEmail);
        if (!ContactNormalizer.IsValidEmail(normalizedEmail))
            return BadRequest(new { message = "Unesite ispravnu email adresu." });

        if (!IsValidChangeCode(request.ChangeCode))
            return Unauthorized(new { message = "Nevažeći kod za promenu." });

        var userId = int.Parse(User.FindFirstValue("userId")!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return Unauthorized(new { message = "Pogrešna trenutna lozinka." });

        if (await _db.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != userId))
            return Conflict(new { message = "Email already in use." });

        var oldEmail = user.Email;
        user.Email = normalizedEmail;
        user.SecurityStamp = Guid.NewGuid().ToString("N");

        _audit.Record(
            AuditActions.UserChangeOwnEmail, AuditEntityTypes.User,
            user.Id.ToString(), $"{oldEmail} → {normalizedEmail}");
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _tokenService.GenerateToken(user);
        return Ok(new AuthResponse(user.Id, token, user.Username, user.Email, user.Role, expiresAt));
    }
}
