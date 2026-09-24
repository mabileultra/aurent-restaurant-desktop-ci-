#!/usr/bin/env bash
# Scale web-backend replicas (HA) while keeping a single api-gateway.
#   BACKEND_REPLICAS=2 bash deploy/ha-up.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
HA_FILE="${HA_FILE:-docker-compose.ha.yml}"
ENV_FILE="${ENV_FILE:-.env}"
REPLICAS="${BACKEND_REPLICAS:-2}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

echo "==> HA up: backend x${REPLICAS} (overlay $HA_FILE, --no-deps)"
docker compose -f "$COMPOSE_FILE" -f "$HA_FILE" --env-file "$ENV_FILE" \
  up -d --no-build --no-deps --scale "backend=${REPLICAS}" backend

echo "==> Recreate api-gateway (single) against scaled backend DNS"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
  up -d --no-build --no-deps api-gateway

echo "==> Waiting for gateway health..."
for i in $(seq 1 36); do
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    exec -T api-gateway curl -fsS http://127.0.0.1:8080/actuator/health 2>/dev/null | grep -q UP; then
    echo "api-gateway UP"
    docker compose -f "$COMPOSE_FILE" -f "$HA_FILE" --env-file "$ENV_FILE" ps backend api-gateway
    exit 0
  fi
  sleep 5
done
echo "Timed out waiting for api-gateway"
exit 1
