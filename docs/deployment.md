# Deployment — odluke i arhitektura

> Radni dokument. Sažetak istraživanja hosting opcija i donetih odluka.
> Kad se infrastruktura promeni, menja se i ovaj dokument.

---

## Arhitektura aplikacije

| Sloj | Tehnologija |
|---|---|
| Frontend | React 19 + Vite, čist SPA (statički build) |
| Backend | ASP.NET Core .NET 9 — REST API + SignalR hub (skupština uživo) |
| Baza | PostgreSQL 16 (EF Core, auto-migracije na startu) |
| Fajlovi | Upload slika vesti na lokalni disk (`wwwroot/uploads`) |

### Ograničenja koja diktiraju izbor hostinga

| Ograničenje | Izvor u kodu | Posledica |
|---|---|---|
| Backend mora ostati na **1 replici** | `AssemblyPresenceTracker` / `AssemblyNotifier` — singletoni u memoriji (`Program.cs`) | Bez horizontalnog skaliranja / serverless |
| Proces mora biti **uvek upaljen** | `PetitionRetentionService` — briše potpise po roku čuvanja | Bez „scale to zero" |
| Treba **trajni disk** | Upload ide na lokalni fs, ne na object storage | Persistent volume obavezan |
| **WebSockets** | SignalR transport | Host mora podržavati WS |
| **EU rezidencija podataka** | Lični podaci + potpisi peticija (posebna vrsta, vidi `evidencija-radnji-obrade.md`) | Server u EU |

**Zaključak:** backend je stateful monolit → mali VPS ili kontejner-sa-diskom, ne serverless PaaS.

---

## Odluka

**Sve na jednom Hetzner Cloud VPS-u.**

| Stavka | Vrednost |
|---|---|
| Provajder | Hetzner Cloud |
| Lokacija | Falkenstein ili Nürnberg (Nemačka, EU) |
| Server | CX22 — 2 vCPU, 4 GB RAM, 40 GB disk (~€4.5/mo sa IPv4 + PDV) |
| Orkestracija | Docker Compose |
| Servisi | Caddy (reverse proxy + automatski TLS) → static frontend + `bedem-api` + `bedem-db` |
| Domen | Jedan (npr. `bedem.rs`) — frontend i API na **istom origin-u** → nema CORS-a |
| Rutiranje | Caddy: `/api/*` i `/hubs/*` → backend; sve ostalo → statički fajlovi |

### Zašto Hetzner, a ne alternative

Urađeno puno poređenje troškova i kompromisa. Sažetak (realan mesečni trošak za *ovaj* stack):

| Opcija | Trošak/mo | Održavanje | Napomena |
|---|---|---|---|
| **Hetzner (izabrano)** | **€10–11** (sa oba sloja backup-a) | ~1–2 h/mesec | 2–3× jeftinije, EU, puna kontrola |
| Railway | $20–30 | ~0 | Najbolja managed opcija, ali skuplje; usage može da raste |
| Render | $16–30 | malo | Free Postgres ističe za 30 dana; free web servis se gasi (ubija hosted service + SignalR) |
| Fly.io | $18–40 | srednje | Managed Postgres skup (~$30); nemanaged = isti posao kao Hetzner ali skuplje |
| Azure | €25–40 (ili ~€0 uz grant) | srednje-visoko | Vredi **samo** ako udruženje dobije Microsoft nonprofit grant (~$2000/god) |
| Vercel (frontend) | $20/mo Pro | — | Hobby ToS zabranjuje upotrebu za organizaciju; za čist SPA ne daje ništa preko Cloudflare Pages |

Ostale opcije su dominirane: svaka je ili skuplja verzija Railway-a ili komplikovanija verzija Hetzner-a, bez prednosti koja bi to opravdala za ovaj app.

---

## Backup — dva sloja

### Sloj 1: Hetzner ugrađeni „Backups"
- Uključuje se po serveru (+20% cene ≈ **€0.76/mo**)
- Dnevni full-server snapshot, čuva **poslednjih 7**
- Namena: brz oporavak celog servera (pogrešna konfiguracija, pad servera)
- Ograničenja: **nije nedeljni**, **nije offsite** (isti provajder, isti nalog)

### Sloj 2: Nedeljni `restic` → Hetzner Storage Box
- Storage Box BX11 — 1 TB, **~€3.80/mo**, podržava SFTP/restic/BorgBackup
- Cron **nedeljom u 03:00**: `pg_dump` baze + `news_uploads` volume
- `restic` = enkripcija + deduplikacija + retencija (`--keep-weekly 8 --keep-monthly 6`)
- Namena: backup koji stvarno spašava — offsite, duga retencija, granularan

```bash
#!/usr/bin/env bash
set -euo pipefail
export RESTIC_REPOSITORY="sftp:uXXXXXX@uXXXXXX.your-storagebox.de:/bedem"
export RESTIC_PASSWORD_FILE=/opt/bedem/.restic-pass

ts=$(date +%F)
mkdir -p /opt/bedem/dump
docker exec bedem-db pg_dump -U postgres bedem | gzip > /opt/bedem/dump/bedem-$ts.sql.gz
restic backup /opt/bedem/dump /var/lib/docker/volumes/*_news_uploads/_data
restic forget --keep-weekly 8 --keep-monthly 6 --prune
rm -f /opt/bedem/dump/bedem-$ts.sql.gz
```

> **Obavezno:** jednom po postavljanju uraditi test restore (`restic restore` na čist folder + `pg_restore` u praznu bazu). Backup koji nije isproban da se vrati — nije backup.

---

## Priprema koda — urađeno (Faza 1)

| Promena | Fajl |
|---|---|
| API base relativan u prod (`VITE_API_BASE ?? ''`), dev iz `.env.development` | `src/services/api.js`, `.env.development` |
| CORS iz `Cors:AllowedOrigins`; prazno → policy se ne aktivira (same-origin prod) | `Program.cs`, `appsettings.Development.json` |
| `UseForwardedHeaders` (X-Forwarded-Proto/For, 1 hop) — Caddy terminira TLS | `Program.cs` |
| **Tajne izvučene iz `appsettings.json`** — `SecretKey`/connection string prazni; dolaze iz env-a | `appsettings.json` |
| **Fail-fast na startu**: prekida boot ako je JWT ključ prazan, kraći od 48 bajtova, ili jednak iscurelom ključu iz git istorije | `Program.cs` |
| Dev vrednosti (throwaway JWT ključ, localhost baza) izmeštene u `appsettings.Development.json` | `appsettings.Development.json` |
| Prod infra: `Dockerfile.web` (build SPA + Caddy), `Caddyfile`, `docker-compose.prod.yml`, `.dockerignore` | (novi) |
| Lokalni `.env` dobio svež dev JWT ključ (stari iscureli više ne prolazi validaciju) | `.env` (gitignored) |

### Rutiranje u Caddy-ju
`/api/*`, `/hubs/*`, **`/uploads/*`** → `bedem-api:5000`; sve ostalo → statički SPA sa `try_files … /index.html`.
`/uploads/*` mora na backend jer se upload slika vesti servira iz `wwwroot/uploads` (`NewsController.UploadImage`).

### Sigurnosni headeri (Caddy)
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Strict-Transport-Security` (1 god).

---

## TODO pre deploya

- [x] JWT ključ: validacija + izbacivanje iz koda. **Ostaje:** generisati svež prod ključ i staviti ga samo u `/opt/bedem/.env` na serveru + password manager.
- [ ] Generisati prod `POSTGRES_PASSWORD` i `JWT_SECRET` (`openssl rand -base64 48`), upisati u server `.env` + password manager.
- [ ] `evidencija-radnji-obrade.md`: popuniti „Iznošenje iz zemlje" = Nemačka (EU); popuniti APR podatke rukovaoca.
- [ ] Registrovati `.rs` domen (RNIDS, ~1.600 RSD/god) i postaviti `A` zapis na IP servera.
- [ ] (opciono) Očistiti iscureli JWT ključ iz git istorije (`git filter-repo`) — nije nužno jer prod koristi nov ključ; istorijski ključ postaje bezvredan čim se prod rotira.
- [ ] Odlučiti o slanju email-a (potvrde registracije) — trenutno nije u kodu.

---

## Runbook

_(Dopuniti nakon prvog deploya: restore procedura, kako se deployuje nova verzija, gde su logovi.)_
