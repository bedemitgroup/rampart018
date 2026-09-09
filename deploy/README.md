# Deployment runbook — Bedem on Hetzner

Single Hetzner Cloud VPS. Docker Compose runs Caddy (TLS + reverse proxy), the
.NET API, and PostgreSQL. Architecture rationale and the hosting comparison are
in [`../docs/deployment.md`](../docs/deployment.md).

```
                internet
                   │  443
              ┌────▼─────┐
              │  Caddy   │  bedem-web   (only container with published ports)
              │  /srv    │──────────────► static SPA
              └────┬─────┘
       /api /hubs  │  /uploads
              ┌────▼─────┐        ┌────────────┐
              │  API     │───────►│ PostgreSQL │
              │ bedem-api│  5432  │  bedem-db  │
              └──────────┘        └─────┬──────┘
                                        │ volume: postgres_data
                                  uploads volume: news_uploads
```

---

## 0. Prerequisites

- A domain (e.g. `bedem.rs`) you can edit DNS for.
- An SSH keypair. Public key ready to paste.
- A read-only **deploy key** on the GitHub repo (Settings → Deploy keys), so the
  server can `git clone` / `git pull`.

## 1. Create the server

Hetzner Cloud Console → **Add Server**:

| Field | Value |
|---|---|
| Location | Falkenstein or Nuremberg (EU) |
| Image | Ubuntu 24.04 |
| Type | **CX22** (shared vCPU, 2 / 4 GB / 40 GB) |
| SSH key | add yours |
| Backups | **enable** (+20%, daily full-server images) |
| Name | `bedem` |

Note the public IP.

## 2. Harden + install Docker

From your machine, in the repo root:

```bash
ssh root@<server-ip> 'bash -s' < deploy/bootstrap.sh "$(cat ~/.ssh/id_ed25519.pub)"
```

This creates the `bedem` user, locks SSH to key-only for that user, disables root
login, enables `ufw` (22/80/443) + `fail2ban` + unattended security upgrades, and
installs Docker. After it finishes, root SSH no longer works — use:

```bash
ssh bedem@<server-ip>
```

## 3. DNS

Create an **A** record: `bedem.rs` → `<server-ip>` (and `www` if wanted, as a
CNAME to `bedem.rs`). Wait for it to resolve (`dig +short bedem.rs`) before the
next step — Caddy needs it to issue the TLS certificate.

## 4. Clone + configure

```bash
ssh bedem@<server-ip>
git clone git@github.com:<owner>/<repo>.git /opt/bedem
cd /opt/bedem

cp .env.example .env
# generate the secrets straight into place:
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=')|" .env
nano .env    # set SITE_DOMAIN=bedem.rs, POSTGRES_DB, POSTGRES_USER, JWT_ISSUER/AUDIENCE
```

**Copy the finished `.env` into a password manager.** Then `chmod 600 .env`.

## 5. First deploy

```bash
deploy/deploy.sh deployment      # or master, whichever branch is production
```

First run pulls base images, builds both images, starts PostgreSQL, then the API
(which runs EF Core migrations on startup), then Caddy (which fetches the cert).
Give it a few minutes. Check:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
curl -fsS https://bedem.rs/api/health      # {"status":"ok"}
```

## 6. Backups

Follow [`backup-setup.md`](backup-setup.md) (Storage Box + restic + weekly cron),
then do one real restore drill per [`restore.md`](restore.md).

## 7. Smoke test (in a browser)

- [ ] `https://bedem.rs` loads, no mixed-content or console errors
- [ ] Register a test account, log in
- [ ] Admin: create a news article **with an image** → image renders at
      `https://bedem.rs/uploads/news/...`
- [ ] Open the assembly page in two tabs → presence updates live (SignalR over
      WSS through Caddy)
- [ ] Sign a petition; check rate-limit headers behave (repeated rapid submits
      get 429)
- [ ] `https://bedem.rs` on a phone

## Day-2 operations

| Task | Command |
|---|---|
| Deploy new version | `cd /opt/bedem && deploy/deploy.sh <branch>` |
| Logs | `docker compose -f docker-compose.prod.yml logs -f [service]` |
| Restart one service | `docker compose -f docker-compose.prod.yml restart backend` |
| DB shell | `docker exec -it bedem-db psql -U <user> -d <db>` |
| Manual backup | `deploy/backup.sh` |
| Disk usage | `df -h && docker system df` |
| Rotate JWT secret | edit `.env`, `deploy/deploy.sh` (all sessions drop, users re-login) |

## Notes / gotchas

- **`ufw` does not gate Docker-published ports.** Only Caddy publishes ports
  (80/443), which we want open. Postgres and the API publish nothing.
- The backend must stay at **one replica** (in-memory SignalR state + the
  petition-retention background job). Do not add `--scale`.
- Data residency: the server is in Germany (EU). Reflect this in
  `docs/evidencija-radnji-obrade.md` → "Iznošenje iz zemlje".
- The JWT key committed in early git history is now inert as long as production
  runs a fresh secret. Scrubbing history (`git filter-repo`) is optional.
