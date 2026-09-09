#!/usr/bin/env bash
#
# Deploy / update the running stack. Run as the "bedem" user on the server:
#   cd /opt/bedem && deploy/deploy.sh [branch]
#
# The backend migrates the database itself on startup, so there is no separate
# migration step.

set -euo pipefail

BRANCH="${1:-master}"
COMPOSE="docker compose -f docker-compose.prod.yml"
APP_DIR="/opt/bedem"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
    echo "Missing $APP_DIR/.env - copy .env.example and fill it in first." >&2
    exit 1
fi

echo ">>> Fetching $BRANCH"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo ">>> Building and starting"
$COMPOSE up -d --build

echo ">>> Waiting for the API to report healthy"
for i in $(seq 1 30); do
    if curl -fsS "https://$(grep -E '^SITE_DOMAIN=' .env | cut -d= -f2)/api/health" >/dev/null 2>&1; then
        echo "API is up."
        break
    fi
    sleep 2
    [[ $i -eq 30 ]] && { echo "API did not come up in time. Check: $COMPOSE logs backend" >&2; exit 1; }
done

echo ">>> Pruning old images"
docker image prune -f >/dev/null

$COMPOSE ps
echo ">>> Deploy done."
