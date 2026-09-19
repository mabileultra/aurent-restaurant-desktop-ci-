#!/usr/bin/env bash
# Тестовая касса на этой машине: локальный UI + offline-first + native SQLite.
# Клиентские кассы не трогает. Обычный запуск: start-cashier-desktop.sh
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTSYSTEM_ROOT="${POSTSYSTEM_ROOT:-$(cd "$DESKTOP_ROOT/.." && pwd)}"

cd "$DESKTOP_ROOT"

if [[ ! -d node_modules/electron ]]; then
  echo "Installing desktop-electron dependencies…"
  npm install
fi

if [[ ! -f ui/index.html ]]; then
  echo "Bundling web-frontend into desktop-electron/ui…"
  npm run bundle-ui
fi

npm run sync-icons

export AURENT_UI_DEV=1
export AURENT_UI_MODE=bundled
export AURENT_OFFLINE_FIRST=1
export AURENT_OFFLINE_ENGINE="${AURENT_OFFLINE_ENGINE:-native}"
export AURENT_WEB_URL="${AURENT_WEB_URL:-http://localhost:5173/cashier/login}"
export AURENT_API_URL="${AURENT_API_URL:-http://localhost:8080/api/v1}"

echo "TEST cashier: bundled UI, offlineFirst, engine=${AURENT_OFFLINE_ENGINE}"
echo "Rollback: bash $POSTSYSTEM_ROOT/scripts/start-cashier-desktop.sh"
echo

exec npm start
