#!/usr/bin/env bash
# Пересоздание одного compose-сервиса: убирает ghost-контейнеры после неудачного up.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
SERVICE="${1:?Usage: bash deploy/docker-recreate-service.sh <service>}"

declare -A CONTAINER_NAMES=(
  [finance-service]=aurent-finance-service
  [backend]=aurent-pos-backend
  [frontend]=aurent-pos-frontend
  [postgres]=aurent-pos-db
  [finance-db]=aurent-finance-db
)

cname="${CONTAINER_NAMES[$SERVICE]:-}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop "$SERVICE" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f "$SERVICE" 2>/dev/null || true

if [[ -n "$cname" ]]; then
  # Удаляем и основной контейнер, и префиксные ghost после failed recreate.
  docker ps -aq --filter "name=${cname}" | xargs -r docker rm -f
fi

exec docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --force-recreate "$SERVICE"
