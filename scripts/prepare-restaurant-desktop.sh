#!/usr/bin/env bash
# Build restaurant-service jar + bundle UI into restaurant-desktop for local/packaged run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[prepare] building restaurant-service jar…"
mvn -pl restaurant-service -am package -DskipTests -q

JAR="$(ls -1 "$ROOT/restaurant-service/target"/restaurant-service-*.jar 2>/dev/null | grep -v plain | head -1 || true)"
if [[ -z "${JAR}" ]]; then
  echo "jar not found in restaurant-service/target" >&2
  exit 1
fi

mkdir -p "$ROOT/restaurant-desktop/resources"
cp -f "$JAR" "$ROOT/restaurant-desktop/resources/restaurant-service.jar"
echo "[prepare] copied $(basename "$JAR") → restaurant-desktop/resources/restaurant-service.jar"

echo "[prepare] bundling restaurant-frontend UI…"
(cd "$ROOT/restaurant-desktop" && npm run bundle-ui)

echo "[prepare] done."
echo "  1) docker compose -f docker-compose.restaurant-edge.yml up -d"
echo "  2) export RESTAURANT_CLOUD_API_URL=https://r-aurent.uz/api/v1"
echo "  3) cd restaurant-desktop && npm start"
