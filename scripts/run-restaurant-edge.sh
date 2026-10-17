#!/usr/bin/env bash
# Phase 1: start local Postgres + restaurant-service with spring profile "edge".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[restaurant-edge] ensuring local Postgres on :5439 ..."
docker compose -f docker-compose.restaurant-edge.yml up -d

echo "[restaurant-edge] waiting for Postgres ..."
for i in $(seq 1 30); do
  if docker exec masterpiece-restaurant-edge-db pg_isready -U restaurant_user -d restaurant_db >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

export SPRING_PROFILES_ACTIVE=edge
export RESTAURANT_DB_URL="${RESTAURANT_DB_URL:-jdbc:postgresql://localhost:5439/restaurant_db}"
export RESTAURANT_DB_USERNAME="${RESTAURANT_DB_USERNAME:-restaurant_user}"
export RESTAURANT_DB_PASSWORD="${RESTAURANT_DB_PASSWORD:-restaurant_password}"
export JWT_SECRET="${JWT_SECRET:-change-me-use-at-least-32-chars-for-hs256!!}"

echo "[restaurant-edge] starting restaurant-service (profile=edge) ..."
if [[ -x ./mvnw ]]; then
  exec ./mvnw -pl restaurant-service -am spring-boot:run -DskipTests
fi
exec mvn -pl restaurant-service -am spring-boot:run -DskipTests
