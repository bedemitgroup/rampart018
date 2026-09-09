using System.Text;
using BedemApi.Data;
using BedemApi.Hubs;
using BedemApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL / EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

// The signing key is a deployment secret: it never ships in appsettings.json,
// it arrives from the environment (JwtSettings__SecretKey). Boot loudly rather
// than sign tokens with a missing, weak, or - worst - a publicly known key.
// HS256 needs at least 256 bits; require a comfortable margin above that.
if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 48)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey is missing or too short. Set the JwtSettings__SecretKey " +
        "environment variable to a random value of at least 48 bytes.");
}

// This value was committed to source control in an early revision. If it ever
// reaches a running server, that server is signing forgeable tokens.
if (secretKey.StartsWith("BedemSecretKey2026", StringComparison.Ordinal))
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey is the leaked development key from git history. " +
        "Rotate it: generate a fresh secret and set JwtSettings__SecretKey.");
}

var jwtIssuer = jwtSettings["Issuer"];
var jwtAudience = jwtSettings["Audience"];
if (string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("JwtSettings:Issuer and JwtSettings:Audience are required.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // A browser cannot set headers on a WebSocket, so the SignalR client puts
    // the token in the socket URL instead. Accepted for the hub path only: a
    // token in a query string on the REST API would land in every access log
    // the request passes through.
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            if (!string.IsNullOrEmpty(accessToken) &&
                context.HttpContext.Request.Path.StartsWithSegments(AssemblyHub.Path))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Behind Caddy (TLS terminator) on the internal Docker network. Honour its
// X-Forwarded-Proto so Request.Scheme is "https", and X-Forwarded-For so the
// framework's RemoteIpAddress is the real client. Only one proxy sits in front,
// so accept exactly one hop. The rate-limiter keys off ClientIpResolver, which
// parses the same chain independently with its own trusted-hop count.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    // Caddy's address on the Docker bridge is assigned at runtime; the backend
    // publishes no port of its own, so its only reachable peer is Caddy.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// CORS. In production the frontend is served from the same origin as the API
// (Caddy routes /api and /hubs to this process, everything else to the static
// bundle), so no browser preflight is involved and the origin list is empty.
// It is only populated in development, where Vite runs on its own port.
var corsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (corsOrigins.Length == 0)
            return;

        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<TokenService>();

// Client IP resolution. The app always sits behind the hosting provider's edge
// proxy, so the real address comes from a header rather than the socket.
builder.Services.Configure<ClientIpOptions>(
    builder.Configuration.GetSection(ClientIpOptions.SectionName));
builder.Services.AddSingleton<IClientIpResolver, ClientIpResolver>();

// Per-IP rate limits on every endpoint that writes to the database.
builder.Services.AddBedemRateLimiting(builder.Configuration);

// Hidden-field bot detection on the public forms.
builder.Services.AddScoped<IHoneypotGuard, HoneypotGuard>();

// Audit trail. Needs the current request to name the actor and their address.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditLogger, AuditLogger>();

// Skupstina. The presence tracker holds who is connected right now, and the
// notifier is the one place outside the hub that pushes to it - both singletons,
// matching IHubContext's own lifetime.
//
// Both live in this process, so the backend must stay at ONE replica: a second
// container would give you two half-full halls. See docker-compose.yml.
builder.Services.AddSignalR();
builder.Services.AddSingleton<IAssemblyPresenceTracker, AssemblyPresenceTracker>();
builder.Services.AddSingleton<IAssemblyNotifier, AssemblyNotifier>();

// Peticije. Signatures are special-category personal data with a published
// retention period, and this is what actually enforces it. Relies on the same
// single-replica constraint as the hall above - two copies would race on the
// same rows.
builder.Services.AddHostedService<PetitionRetentionService>();

builder.Services.AddControllers();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // The schema seeds an admin with a well-known password ("Admin123!"). On a
    // real deployment, replace it with the value from configuration. This runs
    // only while the account still carries the seed password: once it has been
    // changed - here or later from the UI - it is never touched again.
    var seedAdminPassword = app.Configuration["SeedAdmin:Password"];
    if (!string.IsNullOrWhiteSpace(seedAdminPassword))
    {
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Id == 1);
        if (admin is not null && BCrypt.Net.BCrypt.Verify("Admin123!", admin.PasswordHash))
        {
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedAdminPassword);

            var seedAdminEmail = app.Configuration["SeedAdmin:Email"];
            if (!string.IsNullOrWhiteSpace(seedAdminEmail))
                admin.Email = seedAdminEmail;

            await db.SaveChangesAsync();
            app.Logger.LogInformation("Seeded admin credentials replaced from configuration.");
        }
    }
    else if (app.Environment.IsProduction())
    {
        app.Logger.LogWarning(
            "SeedAdmin:Password is not set. The admin account may still use the " +
            "well-known seed password. Set SeedAdmin__Password or change it in the UI.");
    }
}

// First in the pipeline: every later component that reads the scheme or the
// client address needs the forwarded values already applied.
app.UseForwardedHeaders();

app.UseStaticFiles();

app.UseRouting();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

// After authentication, so policies keyed on the user id see a populated
// ClaimsPrincipal. Rejections still carry the CORS headers added above.
var rateLimiting = app.Services.GetRequiredService<IOptions<RateLimitOptions>>().Value;
if (rateLimiting.Enabled)
    app.UseRateLimiter();
else
    app.Logger.LogWarning("Rate limiting is DISABLED by configuration.");

app.MapControllers();

// Liveness + database reachability, for the deploy script and uptime checks.
// Anonymous and unthrottled; it reveals nothing beyond "the app can reach PG".
app.MapGet("/api/health", async (AppDbContext db) =>
        await db.Database.CanConnectAsync()
            ? Results.Ok(new { status = "ok" })
            : Results.Json(new { status = "degraded" }, statusCode: StatusCodes.Status503ServiceUnavailable))
   .AllowAnonymous()
   .DisableRateLimiting();

// Mapped after UseAuthorization so the hub's [Authorize] sees a populated
// principal. Rate limiting is switched off on it explicitly: a hub connection
// is one long-lived request, so a limiter would strangle the transport rather
// than the writes - and every write goes through the controllers anyway.
app.MapHub<AssemblyHub>(AssemblyHub.Path).DisableRateLimiting();

app.Run();
