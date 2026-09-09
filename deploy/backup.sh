#!/usr/bin/env bash
#
# Weekly offsite backup: Postgres dump + uploaded media -> restic -> Hetzner
# Storage Box. Wired to a cron entry by deploy/backup-setup.md.
#
# Reads:
#   /opt/bedem/.env          POSTGRES_USER / POSTGRES_DB
#   /opt/bedem/backup.env    RESTIC_REPOSITORY, RESTIC_PASSWORD_FILE
#
# restic keeps its own history; this script always writes a full logical dump
# and lets restic deduplicate.

set -euo pipefail

APP_DIR="/opt/bedem"
STAGING="$APP_DIR/backup/staging"
UPLOADS_VOLUME="bedem_news_uploads"     # <project>_<volume>; project = dir name
LOG_TAG="bedem-backup"

log() { echo "$(date -Is) $*"; }

set -a
# shellcheck disable=SC1091
. "$APP_DIR/.env"
# shellcheck disable=SC1091
. "$APP_DIR/backup.env"
set +a

: "${POSTGRES_USER:?}" "${POSTGRES_DB:?}" "${RESTIC_REPOSITORY:?}" "${RESTIC_PASSWORD_FILE:?}"

log "start"
rm -rf "$STAGING"
mkdir -p "$STAGING/uploads"

log "pg_dump"
docker exec -i bedem-db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
    > "$STAGING/bedem.sql"

log "copy uploads"
docker run --rm \
    -v "${UPLOADS_VOLUME}:/src:ro" \
    -v "$STAGING/uploads:/dst" \
    alpine sh -c 'cp -a /src/. /dst/ 2>/dev/null || true'

log "restic backup"
restic backup --tag bedem --host bedem "$STAGING"

log "restic forget/prune"
restic forget --tag bedem --host bedem \
    --keep-weekly 8 --keep-monthly 6 --prune

rm -rf "$STAGING"
log "done"
