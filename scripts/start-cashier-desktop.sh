#!/usr/bin/env bash
# Запуск Electron-кассы (desktop-electron в postsystem или aurent-cashier-desktop рядом).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for CAND in "$ROOT/desktop-electron" "${DESKTOP_ROOT:-$(cd "$ROOT/.." && pwd)/aurent-cashier-desktop}"; do
  if [[ -f "$CAND/scripts/start-cashier-desktop.sh" ]]; then
    export POSTSYSTEM_ROOT="$ROOT"
    exec bash "$CAND/scripts/start-cashier-desktop.sh" "$@"
  fi
done

echo "Не найден desktop-electron: $ROOT/desktop-electron" >&2
echo "Или aurent-cashier-desktop рядом с postsystem" >&2
exit 1
