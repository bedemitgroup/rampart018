using BedemApi.Data;
using BedemApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BedemApi.Services;

/// <summary>
/// Deletes the signatures on petitions whose retention period has run out.
///
/// This is the only part of the application that throws personal data away on
/// its own, and it exists because the privacy policy makes a promise —
/// signatures are kept for <see cref="PetitionConsent.RetentionMonths"/> months
/// after a petition closes — that nothing else would keep. A retention period
/// nobody enforces is not a retention period; it is a sentence on a web page.
///
/// The petition itself survives, along with the number of signatures it
/// gathered. That number is no longer personal data, and it is the part of a
/// campaign worth remembering.
///
/// Safe as a singleton background loop because the backend runs at one replica
/// — the same constraint SignalR already imposes, documented in Program.cs. If
/// that ever changes, two copies of this would race on the same rows.
/// </summary>
public class PetitionRetentionService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

    /// <summary>
    /// Migrations run at startup, and this must not sweep against a half-built
    /// schema. Also spares the logs a purge report on every local restart.
    /// </summary>
    private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(2);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PetitionRetentionService> _logger;

    public PetitionRetentionService(
        IServiceScopeFactory scopeFactory,
        ILogger<PetitionRetentionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(StartupDelay, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                await SweepAsync(stoppingToken);
                await Task.Delay(Interval, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Shutdown. Nothing to report.
        }
    }

    private async Task SweepAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow.AddMonths(-PetitionConsent.RetentionMonths);

            var due = await db.Petitions
                .Where(p => p.ClosedAt != null
                            && p.ClosedAt < cutoff
                            && p.SignaturesPurgedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var petition in due)
            {
                var signatures = await db.PetitionSignatures
                    .Where(s => s.PetitionId == petition.Id)
                    .ToListAsync(cancellationToken);

                db.PetitionSignatures.RemoveRange(signatures);

                petition.FinalSignatureCount =
                    (petition.FinalSignatureCount ?? 0) + signatures.Count;

                petition.SignaturesPurgedAt = DateTime.UtcNow;
                petition.Status = PetitionStatus.Archived;

                // No audit row: the audit logger reads the actor off the current
                // HTTP request, and there is none here. The log records people's
                // decisions, and this is a promise keeping itself.
                _logger.LogInformation(
                    "Peticija {PetitionId} ({Title}): obrisano {Count} potpisa po isteku roka čuvanja od {Months} meseci.",
                    petition.Id, petition.Title, signatures.Count, PetitionConsent.RetentionMonths);
            }

            if (due.Count > 0)
                await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // A failed sweep must not take the process down: the next one is in
            // 24 hours and the data is still there to delete. But it is loud,
            // because silently missing a retention deadline is the failure that
            // matters here.
            _logger.LogError(ex, "Brisanje potpisa po isteku roka čuvanja nije uspelo.");
        }
    }
}
