#!/usr/bin/env bash
# Запуск Electron-кассы из desktop-electron в этом репозитории.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="$ROOT/apps/desktop-electron"

if [[ ! -f "$DESKTOP/scripts/start-cashier-desktop.sh" ]]; then
  echo "Не найден apps/desktop-electron: $DESKTOP" >&2
  exit 1
fi

export POSTSYSTEM_ROOT="$ROOT"
if [[ "${1:-}" == "--test" ]]; then
  exec bash "$DESKTOP/scripts/start-cashier-desktop-test.sh"
fi
exec bash "$DESKTOP/scripts/start-cashier-desktop.sh" "$@"
