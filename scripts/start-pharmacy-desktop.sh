#!/usr/bin/env bash
# Launch Aurent Pharmacy Electron from apps/pharmacy-desktop.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="$ROOT/apps/pharmacy-desktop"

if [[ ! -f "$DESKTOP/scripts/start-pharmacy-desktop.sh" ]]; then
  echo "Не найден apps/pharmacy-desktop: $DESKTOP" >&2
  exit 1
fi

export POSTSYSTEM_ROOT="$ROOT"
if [[ "${1:-}" == "--test" ]]; then
  exec bash "$DESKTOP/scripts/start-pharmacy-desktop-test.sh"
fi
exec bash "$DESKTOP/scripts/start-pharmacy-desktop.sh" "$@"
