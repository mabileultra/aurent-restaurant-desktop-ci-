#!/usr/bin/env bash
# Smoke-проверка после деплоя (health + frontend + identity).
# Usage: bash deploy/smoke-check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
API_PORT="${API_PORT:-8080}"
HTTP_PORT="${HTTP_PORT:-80}"

load_dotenv() {
  [[ -f "$ENV_FILE" ]] || return 0
  local line key val
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "${line//[[:space:]]/}" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      printf -v "$key" '%s' "$val"
      export "$key"
    fi
  done < "$ENV_FILE"
}

failures=()

check_health() {
  local name="$1"
  local url="$2"
  if curl -fsS --max-time 10 "$url" | grep -q UP; then
    echo "OK  $name"
  else
    failures+=("$name")
    echo "FAIL $name ($url)"
  fi
}

load_dotenv "$ENV_FILE"
API_PORT="${API_PORT:-8080}"
HTTP_PORT="${HTTP_PORT:-80}"

echo "==> Smoke check $(date -Iseconds)"

check_health "api-gateway" "http://127.0.0.1:${API_PORT}/api/v1/actuator/health" || true
check_health "identity" "http://127.0.0.1:8081/api/v1/actuator/health" || true

fe_port="$(docker compose -f "$COMPOSE_FILE" port frontend 80 2>/dev/null | sed 's/.*://' || echo "$HTTP_PORT")"
code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:${fe_port}/" || echo 000)"
if echo "$code" | grep -qE '200|304'; then
  echo "OK  frontend (:${fe_port} -> ${code})"
else
  failures+=("frontend")
  echo "FAIL frontend (:${fe_port} -> ${code})"
fi

if command -v node >/dev/null 2>&1 && [[ -f scripts/check-module-sync.mjs ]]; then
  if node scripts/check-module-sync.mjs; then
    echo "OK  module-sync"
  else
    failures+=("module-sync")
    echo "FAIL module-sync"
  fi
fi

if [[ "${#failures[@]}" -gt 0 ]]; then
  echo "Smoke check FAILED: ${failures[*]}" >&2
  exit 1
fi

echo "==> Smoke check passed"
