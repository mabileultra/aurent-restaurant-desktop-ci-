#!/usr/bin/env bash
# Копирует артефакты Electron в downloads/desktop/ и генерирует manifest.json.
# Использование (локально или в CI после electron-builder):
#   bash deploy/publish-desktop.sh
#   DESKTOP_DIST=/path/to/dist bash deploy/publish-desktop.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="${DESKTOP_DIST:-$ROOT/desktop-electron/dist}"
DEST="${DESKTOP_DEST:-$ROOT/downloads/desktop}"

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

node "$ROOT/desktop-electron/scripts/generate-manifest.js" \
  --dist "$DIST" \
  --out "$DEST/manifest.json"

echo "==> Desktop installers → $DEST"
