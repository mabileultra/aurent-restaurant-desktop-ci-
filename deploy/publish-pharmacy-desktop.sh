#!/usr/bin/env bash
# Copy pharmacy-desktop Electron artifacts → downloads/pharmacy-desktop/ + manifest.
# Static files only — no docker restart.
#
#   bash deploy/publish-pharmacy-desktop.sh
#   DESKTOP_DIST=apps/pharmacy-desktop/dist bash deploy/publish-pharmacy-desktop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${DESKTOP_DIST:-$ROOT/apps/pharmacy-desktop/dist}"
DEST="${DESKTOP_DEST:-$ROOT/downloads/pharmacy-desktop}"

if [[ ! -d "$DIST" ]]; then
  echo "Нет папки сборки: $DIST" >&2
  exit 1
fi

mkdir -p "$DEST"

shopt -s nullglob
for pattern in '*.exe' '*.dmg' '*.zip' '*.blockmap' 'latest*.yml'; do
  for file in "$DIST"/$pattern; do
    cp -f "$file" "$DEST/"
    echo "  → $(basename "$file")"
  done
done
shopt -u nullglob

node "$ROOT/apps/pharmacy-desktop/scripts/generate-manifest.js" \
  --dist "$DIST" \
  --out "$DEST/manifest.json"

echo "==> Pharmacy desktop installers → $DEST"
