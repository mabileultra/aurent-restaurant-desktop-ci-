#!/usr/bin/env bash
# Copy restaurant-desktop Electron artifacts → downloads/restaurant-desktop/ + manifest.
# Does NOT restart Docker / nginx / any service — static files only.
#
#   bash deploy/publish-restaurant-desktop.sh
#   DESKTOP_DIST=restaurant-desktop/dist bash deploy/publish-restaurant-desktop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${DESKTOP_DIST:-$ROOT/restaurant-desktop/dist}"
DEST="${DESKTOP_DEST:-$ROOT/downloads/restaurant-desktop}"

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

node "$ROOT/restaurant-desktop/scripts/generate-manifest.js" \
  --dist "$DIST" \
  --out "$DEST/manifest.json"

echo "==> Restaurant desktop installers → $DEST (no service restart)"
