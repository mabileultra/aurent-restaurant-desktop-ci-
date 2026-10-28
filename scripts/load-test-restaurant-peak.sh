#!/usr/bin/env bash
# Peak POS load: concurrent cashiers hitting menu + floor (read path).
# Safe defaults: localhost only. Never point at prod without explicit BASE_URL + approval.
#
# Usage:
#   LOAD_TEST_TOKEN='eyJ...' STORE_ID=59 \
#     bash scripts/load-test-restaurant-peak.sh
#
#   # 10k ticks (each tick = 4 GETs → ~40k HTTP calls at CONCURRENCY=100):
#   LOAD_TEST_TOKEN=... STORE_ID=59 PROFILE=peak10k \
#     bash scripts/load-test-restaurant-peak.sh
#
#   BASE_URL=http://127.0.0.1:8080/api/v1 ...
#   # Direct restaurant-service:
#   BASE_URL=http://127.0.0.1:8087/api/v1 ...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
PROFILE="${PROFILE:-default}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080/api/v1}"
STORE_ID="${STORE_ID:?Set STORE_ID (restaurant store id)}"
TOKEN="${LOAD_TEST_TOKEN:?Set LOAD_TEST_TOKEN (Bearer JWT for ADMIN/MANAGER/CASHIER/WAITER)}"
P95_WARN_SEC="${LOAD_TEST_P95_WARN_SEC:-1.5}"
P95_FAIL_SEC="${LOAD_TEST_P95_FAIL_SEC:-5.0}"

case "$PROFILE" in
  smoke)
    REQUESTS="${LOAD_TEST_REQUESTS:-50}"
    CONCURRENCY="${LOAD_TEST_CONCURRENCY:-10}"
    ;;
  peak|peak2k)
    # Target capacity without extra restaurant-service replicas
    REQUESTS="${LOAD_TEST_REQUESTS:-2000}"
    CONCURRENCY="${LOAD_TEST_CONCURRENCY:-80}"
    ;;
  # True 2000 concurrent cashiers — prefer k6: scripts/loadtest/k6-cashiers-2k.js
  cashiers2k)
    REQUESTS="${LOAD_TEST_REQUESTS:-2000}"
    CONCURRENCY="${LOAD_TEST_CONCURRENCY:-2000}"
    ;;
  peak10k)
    REQUESTS="${LOAD_TEST_REQUESTS:-10000}"
    CONCURRENCY="${LOAD_TEST_CONCURRENCY:-100}"
    ;;
  *)
    REQUESTS="${LOAD_TEST_REQUESTS:-200}"
    CONCURRENCY="${LOAD_TEST_CONCURRENCY:-40}"
    ;;
esac

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

BASE_URL="${BASE_URL%/}"

# Peak cashier click: floor POS read path (+ shift / active / kitchen / roster)
ENDPOINTS=(
  "${BASE_URL}/rst/stores/${STORE_ID}/floor-revision"
  "${BASE_URL}/rst/stores/${STORE_ID}/floor"
  "${BASE_URL}/rst/stores/${STORE_ID}/menu-items?posOnly=true"
  "${BASE_URL}/rst/stores/${STORE_ID}/menu-categories?activeOnly=true"
  "${BASE_URL}/rst/stores/${STORE_ID}/shifts/current"
  "${BASE_URL}/rst/stores/${STORE_ID}/orders/active"
  "${BASE_URL}/rst/stores/${STORE_ID}/kitchen-board"
  "${BASE_URL}/users/pos-roster?storeId=${STORE_ID}"
)

echo "==> Restaurant POS peak load"
echo "    profile=$PROFILE base=$BASE_URL store=$STORE_ID"
echo "    ticks=$REQUESTS concurrency=$CONCURRENCY (each tick = ${#ENDPOINTS[@]} GETs ≈ $((REQUESTS * ${#ENDPOINTS[@]})) HTTP)"

if [[ "$BASE_URL" == *"aurent.uz"* ]] || [[ "$BASE_URL" == *"r-aurent"* ]]; then
  echo "WARN: BASE_URL looks like production. Abort unless CONFIRM_PROD_LOAD=1"
  if [[ "${CONFIRM_PROD_LOAD:-}" != "1" ]]; then
    exit 2
  fi
fi

tmp="$(mktemp)"
export auth_hdr="Authorization: Bearer ${TOKEN}"
export LT_E0="${ENDPOINTS[0]}"
export LT_E1="${ENDPOINTS[1]}"
export LT_E2="${ENDPOINTS[2]}"
export LT_E3="${ENDPOINTS[3]}"
export LT_E4="${ENDPOINTS[4]}"
export LT_E5="${ENDPOINTS[5]}"
export LT_E6="${ENDPOINTS[6]}"
export LT_E7="${ENDPOINTS[7]}"

run_tick_exported() {
  local urls=("$LT_E0" "$LT_E1" "$LT_E2" "$LT_E3" "$LT_E4" "$LT_E5" "$LT_E6" "$LT_E7")
  local url t code worst=0
  for url in "${urls[@]}"; do
    t="$(curl -sS -o /dev/null -w '%{http_code} %{time_total}' \
      --max-time 20 -H "$auth_hdr" -H 'Accept: application/json' "$url" 2>/dev/null \
      || echo '000 99')"
    code="${t%% *}"
    time_s="${t##* }"
    # 204 = no open shift — still OK for POS
    if [[ "$code" != "200" && "$code" != "204" ]]; then
      echo "error"
      return
    fi
    if awk -v a="$worst" -v b="$time_s" 'BEGIN { exit !(b+0 > a+0) }'; then
      worst="$time_s"
    fi
  done
  echo "$worst"
}
export -f run_tick_exported

seq 1 "$REQUESTS" | xargs -P "$CONCURRENCY" -I {} bash -c 'run_tick_exported' >"$tmp"

errors="$(grep -c '^error$' "$tmp" || true)"
ok=$((REQUESTS - errors))

if [[ "$ok" -eq 0 ]]; then
  echo "FAIL: all ticks failed (auth? store? BASE_URL?)"
  head -5 "$tmp" || true
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

echo "==> Results (worst latency per tick)"
echo "    OK: $ok / $REQUESTS (errors: $errors)"
echo "    p50: ${p50}s  p95: ${p95}s  max: ${max}s"

rm -f "$tmp" "${tmp}.sorted"

if [[ "$errors" -gt $((REQUESTS / 10)) ]]; then
  echo "FAIL: error rate > 10%"
  exit 1
fi

if awk -v p95="$p95" -v lim="$P95_FAIL_SEC" 'BEGIN { exit !(p95+0 > lim+0) }'; then
  echo "FAIL: p95 > ${P95_FAIL_SEC}s — pool/cache/DB under peak"
  exit 1
fi

if awk -v p95="$p95" -v lim="$P95_WARN_SEC" 'BEGIN { exit !(p95+0 > lim+0) }'; then
  echo "WARN: p95 > ${P95_WARN_SEC}s — check Redis / Hikari / DB"
fi

echo "==> Restaurant peak load test passed"
