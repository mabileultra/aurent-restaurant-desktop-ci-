#!/usr/bin/env bash
# Build restaurant-service jar + JRE + UI into restaurant-desktop for packaged run.
# Postgres is embedded via npm `embedded-postgres` (started by Electron — no Docker).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[prepare] building restaurant-service jar…"
# Windows runners default to windows-1252 — Cyrillic comments in sources need UTF-8.
export LANG="${LANG:-C.UTF-8}"
export LC_ALL="${LC_ALL:-C.UTF-8}"
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
export MAVEN_OPTS="${MAVEN_OPTS:-} -Dfile.encoding=UTF-8"
mvn -pl restaurant-service -am package -DskipTests -q \
  -Dproject.build.sourceEncoding=UTF-8 \
  -Dproject.reporting.outputEncoding=UTF-8

JAR="$(ls -1 "$ROOT/restaurant-service/target"/restaurant-service-*.jar 2>/dev/null | grep -v plain | head -1 || true)"
if [[ -z "${JAR}" ]]; then
  echo "jar not found in restaurant-service/target" >&2
  exit 1
fi

mkdir -p "$ROOT/restaurant-desktop/resources"
cp -f "$JAR" "$ROOT/restaurant-desktop/resources/restaurant-service.jar"
echo "[prepare] copied $(basename "$JAR") → restaurant-desktop/resources/restaurant-service.jar"

echo "[prepare] fetching portable JRE (clean PC)…"
# PREPARE_JRE_TARGETS=mac-arm64,mac-x64 | win-x64 | (empty = host)
# Multiple targets download in parallel via fetch-jre.js --targets
if [[ -n "${PREPARE_JRE_TARGETS:-}" ]]; then
  (cd "$ROOT/restaurant-desktop" && node scripts/fetch-jre.js --targets "$PREPARE_JRE_TARGETS")
else
  (cd "$ROOT/restaurant-desktop" && node scripts/fetch-jre.js)
fi

echo "[prepare] bundling restaurant-frontend UI…"
(cd "$ROOT/restaurant-desktop" && pnpm run bundle-ui)

echo "[prepare] done — open app; Postgres+Java start automatically."
echo "  Optional: export RESTAURANT_CLOUD_API_URL=https://r-aurent.uz/api/v1"
echo "  Dev: cd restaurant-desktop && pnpm start"
