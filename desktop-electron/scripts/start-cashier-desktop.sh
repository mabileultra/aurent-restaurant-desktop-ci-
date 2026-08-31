#!/usr/bin/env bash
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTSYSTEM_ROOT="${POSTSYSTEM_ROOT:-$(cd "$DESKTOP_ROOT/.." && pwd)}"
FRONTEND="$POSTSYSTEM_ROOT/web-frontend"

cd "$DESKTOP_ROOT"

if [[ ! -d node_modules/electron ]]; then
  echo "Installing desktop-electron dependencies…"
  npm install
fi

npm run sync-icons

export AURENT_WEB_URL="${AURENT_WEB_URL:-http://localhost:5173}"
export AURENT_API_URL="${AURENT_API_URL:-http://localhost:8080/api/v1}"

if ! curl -sf "$AURENT_WEB_URL" >/dev/null 2>&1; then
  echo "Frontend not running at $AURENT_WEB_URL"
  echo "Start: cd web-frontend && npm run dev"
fi

exec npm start
