#!/usr/bin/env bash
# Purge migrated pharmacy rows from pos_db AFTER successful cutover verify.
# Destructive. Dry-run by default; pass --execute to apply.
#
#   bash pharmacy-service/scripts/purge-pharmacy-from-pos-db.sh
#   bash pharmacy-service/scripts/purge-pharmacy-from-pos-db.sh --execute
#
# Compose:
#   COMPOSE=1 bash pharmacy-service/scripts/purge-pharmacy-from-pos-db.sh --execute

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

EXECUTE=0
for arg in "$@"; do
  [[ "$arg" == "--execute" ]] && EXECUTE=1
done

PRODUCT_FILTER="p.business_type_id IN (SELECT bt.id FROM business_types bt WHERE UPPER(bt.code) = 'PHARMACY')"
STORE_FILTER="UPPER(st.business_type) = 'PHARMACY'"

run_sql() {
  local sql="$1"
  if [[ "${COMPOSE:-0}" == "1" ]]; then
    local env_file="${ENV_FILE:-.env}"
    # shellcheck disable=SC1090
    set -a; source <(grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "$env_file" | sed 's/\r$//'); set +a
    docker compose -f "${COMPOSE_FILE:-docker-compose.prod.yml}" --env-file "$env_file" exec -T \
      -e PGPASSWORD="${POSTGRES_PASSWORD}" postgres \
      psql -U "${POSTGRES_USER:-pos_user}" -d "${POSTGRES_DB:-pos_db}" -v ON_ERROR_STOP=1 -c "$sql"
  else
    local dsn="${POS_DSN:-postgresql://pos_user:pos_password@127.0.0.1:5433/pos_db}"
    psql "$dsn" -v ON_ERROR_STOP=1 -c "$sql"
  fi
}

echo "=== Purge pharmacy data from pos_db (legacy monolith cleanup) ==="
if [[ "$EXECUTE" -ne 1 ]]; then
  echo "Dry-run. Counts only. Re-run with --execute to delete."
  run_sql "SELECT 'sales' AS t, COUNT(*) FROM sales sa JOIN stores st ON st.id = sa.store_id WHERE $STORE_FILTER
UNION ALL SELECT 'products', COUNT(*) FROM products p WHERE $PRODUCT_FILTER
UNION ALL SELECT 'stock_lots', COUNT(*) FROM stock_lots sl JOIN products p ON p.id = sl.product_id JOIN stores st ON st.id = sl.store_id WHERE $STORE_FILTER AND $PRODUCT_FILTER;"
  exit 0
fi

echo "Executing DELETE in dependency order..."
run_sql "
BEGIN;
DELETE FROM sale_item_lots sil
 USING sale_items si, sales sa, stores st
 WHERE sil.sale_item_id = si.id AND si.sale_id = sa.id AND sa.store_id = st.id AND $STORE_FILTER;

DELETE FROM sale_items si
 USING sales sa, stores st
 WHERE si.sale_id = sa.id AND sa.store_id = st.id AND $STORE_FILTER;

DELETE FROM sales sa
 USING stores st
 WHERE sa.store_id = st.id AND $STORE_FILTER;

DELETE FROM stock_lots sl
 USING products p, stores st
 WHERE sl.product_id = p.id AND sl.store_id = st.id AND $STORE_FILTER AND $PRODUCT_FILTER;

DELETE FROM stock_receipt_lines srl
 USING stock_receipts sr, stores st, products p
 WHERE srl.receipt_id = sr.id AND sr.store_id = st.id AND srl.product_id = p.id
   AND $STORE_FILTER AND $PRODUCT_FILTER;

DELETE FROM stock_receipts sr
 USING stores st
 WHERE sr.store_id = st.id AND $STORE_FILTER;

DELETE FROM store_stock ss
 USING products p
 WHERE ss.product_id = p.id AND $PRODUCT_FILTER;

DELETE FROM product_barcodes pb
 USING products p
 WHERE pb.product_id = p.id AND $PRODUCT_FILTER;

DELETE FROM product_attributes pa
 USING products p
 WHERE pa.product_id = p.id AND $PRODUCT_FILTER;

DELETE FROM products p WHERE $PRODUCT_FILTER;
COMMIT;
"
echo "Purge complete."
