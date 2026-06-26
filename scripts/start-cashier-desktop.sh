#!/usr/bin/env bash
# Запуск Electron-кассы (репозиторий aurent-cashier-desktop рядом с postsystem).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_ROOT="${DESKTOP_ROOT:-$(cd "$ROOT/.." && pwd)/aurent-cashier-desktop}"
SCRIPT="$DESKTOP_ROOT/scripts/start-cashier-desktop.sh"

if [[ ! -f "$SCRIPT" ]]; then
  echo "Не найден desktop-репозиторий: $DESKTOP_ROOT" >&2
  echo "Ожидается: ~/Desktop/aurent-cashier-desktop рядом с postsystem" >&2
  echo "Или задайте: DESKTOP_ROOT=/path/to/aurent-cashier-desktop" >&2
  exit 1
fi

export POSTSYSTEM_ROOT="$ROOT"
exec bash "$SCRIPT" "$@"
