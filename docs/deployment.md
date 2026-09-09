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
| Lokacija | Nürnberg (Nemačka, EU) |
| Server | **CPX12** — 1 vCPU, 2 GB RAM, 40 GB disk (~€11.49/mo + €0.50 IPv4 + €2.30 backups). CX22 (Intel, 4 GB, ~€4.5) je bio nedostupan pri kreiranju; preći na njega ili na CPX22 ako zatreba. `bootstrap.sh` dodaje 3 GB swap za build na 2 GB. |
| Orkestracija | Docker Compose |
| Servisi | Caddy (reverse proxy + automatski TLS) → static frontend + `bedem-api` + `bedem-db` |
| Domen | `bedem018.rs` (RNIDS) — frontend i API na **istom origin-u** → nema CORS-a |
| Rutiranje | Caddy: `/api/*` i `/hubs/*` → backend; sve ostalo → statički fajlovi |

### Zašto Hetzner, a ne alternative

Urađeno puno poređenje troškova i kompromisa. Sažetak (realan mesečni trošak za *ovaj* stack):

| Opcija | Trošak/mo | Održavanje | Napomena |
|---|---|---|---|
| **Hetzner (izabrano)** | **~€18** CPX12 + backups + Storage Box (sa CX22: ~€10) | ~1–2 h/mesec | i dalje jeftinije od svega ispod, EU, puna kontrola |
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

## Priprema koda — urađeno (Faza 1 + 2)

| Promena | Fajl |
|---|---|
| API base relativan u prod (`VITE_API_BASE ?? ''`), dev iz `.env.development` | `src/services/api.js`, `.env.development` |
| CORS iz `Cors:AllowedOrigins`; prazno → policy se ne aktivira (same-origin prod) | `Program.cs`, `appsettings.Development.json` |
| `UseForwardedHeaders` (X-Forwarded-Proto/For, 1 hop) — Caddy terminira TLS | `Program.cs` |
| **Tajne izvučene iz `appsettings.json`** — `SecretKey`/connection string prazni; dolaze iz env-a | `appsettings.json` |
| **Fail-fast na startu**: prekida boot ako je JWT ključ prazan, kraći od 48 bajtova, ili jednak iscurelom ključu iz git istorije | `Program.cs` |
| **Seedovani admin (`admin`/`Admin123!`)**: na prvom boot-u API menja lozinku i email iz `SeedAdmin__Password`/`SeedAdmin__Email`; radi samo dok je još na seed lozinci | `Program.cs`, `docker-compose.prod.yml`, `.env.example` |
| `GET /api/health` (anoniman, provera konekcije ka bazi) | `Program.cs` |
| Dev vrednosti (throwaway JWT ključ, localhost baza) izmeštene u `appsettings.Development.json` | `appsettings.Development.json` |
| Prod infra: `Dockerfile.web` (build SPA + Caddy), `Caddyfile`, `docker-compose.prod.yml`, `.dockerignore`, `.gitattributes` | (novi) |
| Deploy skripte + runbook | `deploy/` |
| Lokalni `.env` dobio svež dev JWT ključ (stari iscureli više ne prolazi validaciju) | `.env` (gitignored) |

### Rutiranje u Caddy-ju
`/api/*`, `/hubs/*`, **`/uploads/*`** → `bedem-api:5000`; sve ostalo → statički SPA sa `try_files … /index.html`.
`/uploads/*` mora na backend jer se upload slika vesti servira iz `wwwroot/uploads` (`NewsController.UploadImage`).

### Sigurnosni headeri (Caddy)
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Strict-Transport-Security` (1 god).

---

## TODO pre deploya

- [x] JWT ključ: validacija + izbacivanje iz koda.
- [x] Seedovani admin: override lozinke/emaila iz env-a na prvom boot-u.
- [x] `evidencija-radnji-obrade.md`: APR podaci rukovaoca + iznošenje u EU (Hetzner/Nemačka).
- [x] Registrovan domen: **`bedem018.rs`** (RNIDS).
- [ ] Na serveru generisati `JWT_SECRET`, `POSTGRES_PASSWORD`, `SEED_ADMIN_PASSWORD` (`deploy/README.md` korak 4), upisati u password manager.
- [ ] Postaviti `A` zapis `bedem018.rs` → IP servera.
- [ ] Potpisati DPA sa Hetznerom.
- [ ] (opciono) Očistiti iscureli JWT ključ iz git istorije (`git filter-repo`) — nije nužno jer prod koristi nov ključ.
- [ ] Odlučiti o slanju email-a (potvrde registracije) — trenutno nije u kodu.

---

## Runbook

Skripte i korak-po-korak uputstvo su u [`../deploy/`](../deploy/):

| Fajl | Šta |
|---|---|
| `deploy/README.md` | Ceo redosled: kreiranje servera → hardening → DNS → clone → prvi deploy → smoke test |
| `deploy/bootstrap.sh` | Jednokratno na svežem serveru: ne-root korisnik, SSH lockdown, `ufw`, `fail2ban`, auto-updates, Docker |
| `deploy/deploy.sh` | Deploy/update: `git pull` + `compose up -d --build` + health check |
| `deploy/backup-setup.md` | Storage Box + `restic` + nedeljni cron (jednokratno) |
| `deploy/backup.sh` | Nedeljni backup: `pg_dump` + upload fajlovi → `restic` |
| `deploy/restore.md` | Restore procedura (baza, fajlovi, ceo server) |

Health endpoint: `GET /api/health` → `{"status":"ok"}` (anoniman, bez rate limita).
