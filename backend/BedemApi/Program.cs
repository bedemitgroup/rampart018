using System.Text;
using BedemApi.Data;
using BedemApi.Hubs;
using BedemApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL / EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

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
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
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

builder.Services.AddControllers();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

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

// Mapped after UseAuthorization so the hub's [Authorize] sees a populated
// principal. Rate limiting is switched off on it explicitly: a hub connection
// is one long-lived request, so a limiter would strangle the transport rather
// than the writes - and every write goes through the controllers anyway.
app.MapHub<AssemblyHub>(AssemblyHub.Path).DisableRateLimiting();

app.Run();
