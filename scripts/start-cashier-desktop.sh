#!/usr/bin/env bash
# Запуск Electron-кассы: сначала полная aurent-cashier-desktop (офлайн SQLite),
# иначе desktop-electron в postsystem.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AURENT="${DESKTOP_ROOT:-$(cd "$ROOT/.." && pwd)/aurent-cashier-desktop}"

for CAND in "$AURENT" "$ROOT/desktop-electron"; do
  if [[ -f "$CAND/scripts/start-cashier-desktop.sh" ]]; then
    export POSTSYSTEM_ROOT="$ROOT"
    exec bash "$CAND/scripts/start-cashier-desktop.sh" "$@"
  fi
done

echo "Не найден aurent-cashier-desktop: $AURENT" >&2
echo "Или desktop-electron: $ROOT/desktop-electron" >&2
exit 1
