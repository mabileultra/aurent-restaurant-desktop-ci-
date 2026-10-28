#!/usr/bin/env bash
# Тестовая касса на этой машине: локальный UI + offline-first + native SQLite.
# Клиентские кассы не трогает. Обычный запуск: start-cashier-desktop.sh
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTSYSTEM_ROOT="${POSTSYSTEM_ROOT:-$(cd "$DESKTOP_ROOT/.." && pwd)}"

cd "$DESKTOP_ROOT"

if [[ ! -d node_modules/electron ]]; then
  echo "Installing desktop-electron dependencies…"
  pnpm install
fi

if [[ ! -f ui/index.html ]]; then
  echo "Bundling web-frontend into desktop-electron/ui…"
  pnpm run bundle-ui
fi

pnpm run sync-icons

export AURENT_UI_DEV=1
export AURENT_UI_MODE=bundled
export AURENT_OFFLINE_FIRST=1
# sql.js — как у клиентов; native только если явно AURENT_OFFLINE_ENGINE=native
export AURENT_OFFLINE_ENGINE="${AURENT_OFFLINE_ENGINE:-sqljs}"

# Локальный :8080 / :5173 часто не запущен → чёрный экран. Для теста по умолчанию прод.
if [[ "${AURENT_TEST_LOCAL_API:-}" == "1" ]]; then
  export AURENT_WEB_URL="${AURENT_WEB_URL:-http://localhost:5173/cashier/login}"
  export AURENT_API_URL="${AURENT_API_URL:-http://localhost:8080/api/v1}"
else
  export AURENT_WEB_URL="https://aurent.uz/cashier/login"
  export AURENT_API_URL="https://aurent.uz/api/v1"
fi

echo "TEST cashier: bundled UI, offlineFirst, engine=${AURENT_OFFLINE_ENGINE}"
echo "API: $AURENT_API_URL"
echo "Rollback: bash $POSTSYSTEM_ROOT/scripts/start-cashier-desktop.sh"
echo

exec pnpm start
