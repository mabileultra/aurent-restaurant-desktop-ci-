#!/usr/bin/env bash
set -euo pipefail

DESKTOP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTSYSTEM_ROOT="${POSTSYSTEM_ROOT:-$(cd "$DESKTOP_ROOT/../.." && pwd)}"

cd "$DESKTOP_ROOT"

if [[ ! -d node_modules/electron ]]; then
  echo "Installing pharmacy-desktop dependencies…"
  pnpm install
fi

pnpm run sync-icons

export AURENT_WEB_URL="${AURENT_WEB_URL:-http://localhost:5175/login}"
export AURENT_API_URL="${AURENT_API_URL:-http://localhost:8080/api/v1}"

if ! curl -sf "$AURENT_WEB_URL" >/dev/null 2>&1; then
  echo "Pharmacy SPA not running at $AURENT_WEB_URL"
  echo "Start: cd apps/pharmacy-frontend && pnpm dev"
fi

exec pnpm start
