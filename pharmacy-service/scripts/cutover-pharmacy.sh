#!/usr/bin/env bash
# One-shot pharmacy cutover helper: migrate (optional) → verify counts → remind to clear env.
#
# Local (shared Postgres :5433):
#   bash pharmacy-service/scripts/cutover-pharmacy.sh verify
#   MIGRATE=1 bash .local-run/start-pharmacy.sh   # then verify again
#
# Docker compose (prod/staging on server):
#   bash pharmacy-service/scripts/cutover-pharmacy.sh migrate-compose
#   bash pharmacy-service/scripts/cutover-pharmacy.sh verify-compose
#   bash pharmacy-service/scripts/cutover-pharmacy.sh clear-migrate-env
#
# Env overrides:
#   COMPOSE_FILE, ENV_FILE, POS_DSN, PHARM_DSN

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
CMD="${1:-help}"

compose() {
  if [[ -f "$ENV_FILE" ]]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

require_psql() {
  if ! command -v psql >/dev/null 2>&1; then
    echo "psql not found in PATH. Install client tools or run verify-compose on the host."
    exit 1
  fi
}

cmd_verify() {
  require_psql
  bash "$ROOT/pharmacy-service/scripts/verify-pharmacy-migration.sh"
}

cmd_verify_compose() {
  local pos_user pos_db pharm_user pharm_db
  pos_user="$(compose exec -T postgres printenv POSTGRES_USER 2>/dev/null || echo pos_user)"
  pos_db="$(compose exec -T postgres printenv POSTGRES_DB 2>/dev/null || echo pos_db)"
  pharm_user="$(compose exec -T pharmacy-db printenv POSTGRES_USER 2>/dev/null || echo pharmacy_user)"
  pharm_db="$(compose exec -T pharmacy-db printenv POSTGRES_DB 2>/dev/null || echo pharmacy_db)"

  echo "=== Compose verify via docker exec ==="
  echo "POS:   $pos_user@$pos_db"
  echo "PHARM: $pharm_user@$pharm_db"
  echo

  POS_DSN="postgresql://${pos_user}@postgres:5432/${pos_db}" \
  PHARM_DSN="postgresql://${pharm_user}@pharmacy-db:5432/${pharm_db}" \
  compose run --rm --no-deps \
    -e POS_DSN \
    -e PHARM_DSN \
    pharmacy-service \
    bash -lc 'echo "Use host verify if image has no psql client"; exit 0' >/dev/null 2>&1 || true

  # Prefer host-side counts through compose exec (no psql in app image required).
  FAIL=0
  check() {
    local label="$1" pos_sql="$2" pharm_sql="$3"
    local pos_n pharm_n
    pos_n="$(compose exec -T postgres psql -U "$pos_user" -d "$pos_db" -Atqc "$pos_sql")"
    pharm_n="$(compose exec -T pharmacy-db psql -U "$pharm_user" -d "$pharm_db" -Atqc "$pharm_sql")"
    if [[ "$pos_n" == "$pharm_n" ]]; then
      printf 'OK   %-22s pos=%-8s pharmacy=%s\n' "$label" "$pos_n" "$pharm_n"
    else
      printf 'DIFF %-22s pos=%-8s pharmacy=%s\n' "$label" "$pos_n" "$pharm_n"
      FAIL=1
    fi
  }

  PRODUCT_FILTER="p.business_type_id IN (SELECT bt.id FROM business_types bt WHERE UPPER(bt.code) = 'PHARMACY')"
  STORE_FILTER="UPPER(st.business_type) = 'PHARMACY'"

  check "products" \
    "SELECT COUNT(*) FROM products p WHERE $PRODUCT_FILTER" \
    "SELECT COUNT(*) FROM products"
  check "stock_lots" \
    "SELECT COUNT(*) FROM stock_lots sl JOIN products p ON p.id = sl.product_id JOIN stores st ON st.id = sl.store_id WHERE $STORE_FILTER AND $PRODUCT_FILTER" \
    "SELECT COUNT(*) FROM stock_lots"
  check "sales" \
    "SELECT COUNT(*) FROM sales sa JOIN stores st ON st.id = sa.store_id WHERE $STORE_FILTER" \
    "SELECT COUNT(*) FROM sales"

  echo
  if [[ "$FAIL" -eq 0 ]]; then
    echo "Core checks passed. Full matrix: bash pharmacy-service/scripts/verify-pharmacy-migration.sh"
    exit 0
  fi
  echo "Mismatch — do not clear POS_CORE_DATASOURCE_* yet."
  exit 1
}

cmd_migrate_compose() {
  echo "==> Enabling one-shot migration env and recreating pharmacy-service"
  echo "    Set in $ENV_FILE (if missing):"
  echo "      POS_CORE_DATASOURCE_URL=jdbc:postgresql://postgres:5432/\${POSTGRES_DB:-pos_db}"
  echo "      POS_CORE_DATASOURCE_USERNAME=\${POSTGRES_USER:-pos_user}"
  echo "      POS_CORE_DATASOURCE_PASSWORD=\${POSTGRES_PASSWORD}"
  echo
  if ! grep -q '^POS_CORE_DATASOURCE_URL=' "$ENV_FILE" 2>/dev/null; then
    echo "ERROR: POS_CORE_DATASOURCE_URL not set in $ENV_FILE"
    exit 1
  fi
  compose up -d --force-recreate pharmacy-service
  echo "==> Waiting for health..."
  for i in $(seq 1 40); do
    if compose exec -T pharmacy-service curl -fsS http://127.0.0.1:8089/api/v1/actuator/health 2>/dev/null | grep -q UP; then
      echo "pharmacy-service UP"
      echo "Next: bash pharmacy-service/scripts/cutover-pharmacy.sh verify-compose"
      exit 0
    fi
    sleep 3
  done
  echo "Timed out waiting for pharmacy-service. Check: docker compose logs pharmacy-service"
  exit 1
}

cmd_clear_migrate_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "No $ENV_FILE"
    exit 1
  fi
  local bak="${ENV_FILE}.bak.pharmacy-cutover.$(date +%Y%m%d%H%M%S)"
  cp "$ENV_FILE" "$bak"
  # shellcheck disable=SC2016
  sed -i.tmp \
    -e '/^POS_CORE_DATASOURCE_URL=/d' \
    -e '/^POS_CORE_DATASOURCE_USERNAME=/d' \
    -e '/^POS_CORE_DATASOURCE_PASSWORD=/d' \
    "$ENV_FILE"
  rm -f "${ENV_FILE}.tmp"
  echo "Removed POS_CORE_DATASOURCE_* from $ENV_FILE (backup: $bak)"
  compose up -d --force-recreate pharmacy-service
  echo "pharmacy-service recreated without migrator source DB."
}

cmd_help() {
  cat <<'EOF'
Pharmacy cutover commands:

  verify              Local psql count check (POS_DSN / PHARM_DSN)
  verify-compose      Count check via docker compose exec
  migrate-compose     Recreate pharmacy-service with POS_CORE_DATASOURCE_* set
  clear-migrate-env   Strip POS_CORE_DATASOURCE_* from ENV_FILE and recreate service

Typical staging/prod sequence:
  1. Deploy code with pharmacy-service
  2. Add POS_CORE_DATASOURCE_* to .env / .env.staging
  3. bash pharmacy-service/scripts/cutover-pharmacy.sh migrate-compose
  4. bash pharmacy-service/scripts/cutover-pharmacy.sh verify-compose
  5. bash pharmacy-service/scripts/cutover-pharmacy.sh clear-migrate-env
EOF
}

case "$CMD" in
  verify) cmd_verify ;;
  verify-compose) cmd_verify_compose ;;
  migrate-compose) cmd_migrate_compose ;;
  clear-migrate-env) cmd_clear_migrate_env ;;
  help|-h|--help) cmd_help ;;
  *) echo "Unknown command: $CMD"; cmd_help; exit 1 ;;
esac
