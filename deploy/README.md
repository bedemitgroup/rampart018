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

- The domain `bedem018.rs` with DNS you can edit.
- An SSH keypair. Public key ready to paste.
- A read-only **deploy key** on the GitHub repo (Settings → Deploy keys), so the
  server can `git clone` / `git pull`.

## 1. Create the server

Hetzner Cloud Console → **Add Server**:

| Field | Value |
|---|---|
| Location | Nuremberg / Falkenstein / Helsinki (EU) |
| Image | **Ubuntu 24.04 LTS** |
| Type | **CPX12** (1 vCPU / 2 GB / 40 GB, ~€11.49). If the cheaper CX22 (Intel, 4 GB, ~€4.51) or CAX21 (Arm, 8 GB) is in stock, take that instead — nothing else changes. |
| SSH key | add yours |
| Backups | **enable** (+20%, daily full-server images) |
| Name | `bedem` |

Note the public IP.

> On the 2 GB CPX12, `bootstrap.sh` adds a 3 GB swapfile so a container image
> build does not OOM. Runtime footprint of the stack is ~700 MB–1 GB. If load
> grows, rescale to CPX22 (2 vCPU / 4 GB) from the console — same line, keeps the
> disk, no migration.

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

Create an **A** record: `bedem018.rs` → `<server-ip>` (and `www` as a CNAME to
`bedem018.rs` if wanted). Wait for it to resolve (`dig +short bedem018.rs`)
before the next step — Caddy needs it to issue the TLS certificate.

## 4. Clone + configure

```bash
ssh bedem@<server-ip>
git clone git@github.com:<owner>/<repo>.git /opt/bedem
cd /opt/bedem

cp .env.example .env
# generate the secrets straight into place:
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=')|" .env
sed -i "s|^SEED_ADMIN_PASSWORD=.*|SEED_ADMIN_PASSWORD=$(openssl rand -base64 18)|" .env
nano .env    # set SITE_DOMAIN=bedem018.rs, POSTGRES_DB, POSTGRES_USER,
             # JWT_ISSUER/AUDIENCE, SEED_ADMIN_EMAIL
```

**Copy the finished `.env` into a password manager** — including the generated
`SEED_ADMIN_PASSWORD`, that is the admin login. Then `chmod 600 .env`.

## 5. First deploy

```bash
deploy/deploy.sh deployment      # or master, whichever branch is production
```

First run pulls base images, builds both images, starts PostgreSQL, then the API
(which runs EF Core migrations on startup and swaps the seeded admin password
for `SEED_ADMIN_PASSWORD`), then Caddy (which fetches the cert). Give it a few
minutes. Check:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
curl -fsS https://bedem018.rs/api/health      # {"status":"ok"}
```

## 6. Backups

Follow [`backup-setup.md`](backup-setup.md) (Storage Box + restic + weekly cron),
then do one real restore drill per [`restore.md`](restore.md).

## 7. Smoke test (in a browser)

- [ ] `https://bedem018.rs` loads, no mixed-content or console errors
- [ ] Log in as admin (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`);
      confirm `admin` / `Admin123!` no longer works
- [ ] Register a test account, log in
- [ ] Admin: create a news article **with an image** → image renders at
      `https://bedem018.rs/uploads/news/...`
- [ ] Open the assembly page in two tabs → presence updates live (SignalR over
      WSS through Caddy)
- [ ] Sign a petition; check rate-limit headers behave (repeated rapid submits
      get 429)
- [ ] `https://bedem018.rs` on a phone

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
| Reset admin password | change it in the UI; or if still on the seed password, set `SEED_ADMIN_PASSWORD` in `.env` and redeploy |

## Notes / gotchas

- **`ufw` does not gate Docker-published ports.** Only Caddy publishes ports
  (80/443), which we want open. Postgres and the API publish nothing.
- The backend must stay at **one replica** (in-memory SignalR state + the
  petition-retention background job). Do not add `--scale`.
- Data residency: the server is in Germany (EU). Reflect this in
  `docs/evidencija-radnji-obrade.md` → "Iznošenje iz zemlje".
- The JWT key committed in early git history is now inert as long as production
  runs a fresh secret. Scrubbing history (`git filter-repo`) is optional.
