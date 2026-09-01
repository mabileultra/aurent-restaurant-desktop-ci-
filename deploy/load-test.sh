#!/usr/bin/env bash
# Простой нагрузочный тест API (health). Безопасен для прода — только GET health.
#
# Usage:
#   bash deploy/load-test.sh
#   LOAD_TEST_REQUESTS=200 LOAD_TEST_CONCURRENCY=20 bash deploy/load-test.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
API_PORT="${API_PORT:-8080}"
REQUESTS="${LOAD_TEST_REQUESTS:-50}"
CONCURRENCY="${LOAD_TEST_CONCURRENCY:-10}"

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

load_dotenv "$ENV_FILE"
API_PORT="${API_PORT:-8080}"
URL="${LOAD_TEST_URL:-http://127.0.0.1:${API_PORT}/api/v1/actuator/health}"

echo "==> Load test: $URL"
echo "    requests=$REQUESTS concurrency=$CONCURRENCY"

tmp="$(mktemp)"
export URL
seq 1 "$REQUESTS" | xargs -P "$CONCURRENCY" -I {} bash -c \
  'curl -fsS -o /dev/null -w "%{time_total}\n" --max-time 15 "$URL" 2>/dev/null || echo error' \
  >"$tmp"

errors="$(grep -c '^error$' "$tmp" || true)"
ok=$((REQUESTS - errors))

if [[ "$ok" -eq 0 ]]; then
  echo "FAIL: all requests failed"
  rm -f "$tmp"
  exit 1
fi

grep -v '^error$' "$tmp" | sort -n >"${tmp}.sorted"
lines="$(wc -l <"${tmp}.sorted" | tr -d ' ')"
p50_line=$(( (lines * 50 + 99) / 100 ))
p95_line=$(( (lines * 95 + 99) / 100 ))
p50="$(sed -n "${p50_line}p" "${tmp}.sorted")"
p95="$(sed -n "${p95_line}p" "${tmp}.sorted")"
max="$(tail -1 "${tmp}.sorted")"

echo "==> Results"
echo "    OK: $ok / $REQUESTS (errors: $errors)"
echo "    p50: ${p50}s  p95: ${p95}s  max: ${max}s"

rm -f "$tmp" "${tmp}.sorted"

if [[ "$errors" -gt $((REQUESTS / 10)) ]]; then
  echo "FAIL: error rate > 10%"
  exit 1
fi

if awk -v p95="$p95" 'BEGIN { exit !(p95+0 > 2.0) }'; then
  echo "WARN: p95 > 2s — проверьте нагрузку на сервер"
fi

echo "==> Load test passed"
