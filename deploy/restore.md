# Restore procedure

Run as `bedem` on the server (with `sudo` where shown). Environment for restic:

```bash
sudo -i
set -a; . /opt/bedem/backup.env; set +a
restic snapshots            # pick the snapshot id you want
```

## Restore files from a snapshot

```bash
SNAP=<snapshot-id>
restic restore "$SNAP" --target /opt/bedem/restore
ls /opt/bedem/restore/opt/bedem/backup/staging
#   bedem.sql   uploads/
```

## Database

This overwrites the current database with the dump's contents (`--clean`).
Stop the API first so nothing writes mid-restore.

```bash
cd /opt/bedem
docker compose -f docker-compose.prod.yml stop backend

set -a; . .env; set +a
docker exec -i bedem-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    < /opt/bedem/restore/opt/bedem/backup/staging/bedem.sql

docker compose -f docker-compose.prod.yml start backend
```

## Uploaded media

```bash
docker run --rm \
    -v bedem_news_uploads:/dst \
    -v /opt/bedem/restore/opt/bedem/backup/staging/uploads:/src:ro \
    alpine sh -c 'cp -a /src/. /dst/'
```

## Whole-server loss

1. New CX22, run `deploy/bootstrap.sh`.
2. `git clone` the repo to `/opt/bedem`, restore `/opt/bedem/.env`,
   `/opt/bedem/backup.env`, `/opt/bedem/.restic-pass`, and `/root/.ssh/*`
   from the password manager.
3. `deploy/deploy.sh` to bring the stack up (schema is created by migrations).
4. Restore DB + uploads from restic as above.
5. Repoint DNS to the new IP.
