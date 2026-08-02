#!/usr/bin/env bash
# Пересоздание одного compose-сервиса: убирает ghost-контейнеры после неудачного up.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
SERVICE="${1:?Usage: bash deploy/docker-recreate-service.sh <service>}"

declare -A CONTAINER_NAMES=(
  [postgres]=aurent-pos-db
  [finance-db]=aurent-finance-db
  [identity-db]=aurent-identity-db
  [platform-db]=aurent-platform-db
  [reporting-db]=aurent-reporting-db
  [crm-db]=aurent-crm-db
  [redpanda]=aurent-redpanda
  [finance-service]=aurent-finance-service
  [identity-service]=aurent-identity-service
  [platform-service]=aurent-platform-service
  [reporting-service]=aurent-reporting-service
  [crm-service]=aurent-crm-service
  [ai-service]=aurent-ai-service
  [backend]=aurent-pos-backend
  [api-gateway]=aurent-api-gateway
  [frontend]=aurent-pos-frontend
)

cname="${CONTAINER_NAMES[$SERVICE]:-}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop "$SERVICE" 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f "$SERVICE" 2>/dev/null || true

if [[ -n "$cname" ]]; then
  docker ps -aq --filter "name=${cname}" | xargs -r docker rm -f
fi

exec docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --force-recreate "$SERVICE"
