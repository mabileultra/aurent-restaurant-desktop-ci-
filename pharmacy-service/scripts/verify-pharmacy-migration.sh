#!/usr/bin/env bash
# Compare pharmacy row counts between pos_db (source) and pharmacy_db (target).
# Usage (local docker ports):
#   bash pharmacy-service/scripts/verify-pharmacy-migration.sh
# Override:
#   POS_DSN='postgresql://pos_user:pos_password@127.0.0.1:5433/pos_db' \
#   PHARM_DSN='postgresql://pharmacy_user:pharmacy_password@127.0.0.1:5441/pharmacy_db' \
#   bash pharmacy-service/scripts/verify-pharmacy-migration.sh

set -euo pipefail

POS_DSN="${POS_DSN:-postgresql://pos_user:pos_password@127.0.0.1:5433/pos_db}"
PHARM_DSN="${PHARM_DSN:-postgresql://pharmacy_user:pharmacy_password@127.0.0.1:5433/pharmacy_db}"

psql_q() {
  local dsn="$1"
  local sql="$2"
  psql "$dsn" -Atqc "$sql"
}

echo "=== Pharmacy migration verification ==="
echo "POS:   $POS_DSN"
echo "PHARM: $PHARM_DSN"
echo

PRODUCT_FILTER="p.business_type_id IN (SELECT bt.id FROM business_types bt WHERE UPPER(bt.code) = 'PHARMACY')"
STORE_FILTER="UPPER(st.business_type) = 'PHARMACY'"

check() {
  local label="$1"
  local pos_sql="$2"
  local pharm_sql="$3"
  local pos_n pharm_n
  pos_n=$(psql_q "$POS_DSN" "$pos_sql")
  pharm_n=$(psql_q "$PHARM_DSN" "$pharm_sql")
  if [[ "$pos_n" == "$pharm_n" ]]; then
    printf 'OK   %-22s pos=%-8s pharmacy=%s\n' "$label" "$pos_n" "$pharm_n"
  else
    printf 'DIFF %-22s pos=%-8s pharmacy=%s\n' "$label" "$pos_n" "$pharm_n"
    FAIL=1
  fi
}

FAIL=0

check "categories" \
  "SELECT COUNT(DISTINCT c.id) FROM categories c JOIN products p ON p.category_id = c.id WHERE $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM categories"

check "suppliers" \
  "SELECT COUNT(DISTINCT s.id) FROM suppliers s WHERE s.company_id IN (SELECT DISTINCT p.company_id FROM products p WHERE $PRODUCT_FILTER)" \
  "SELECT COUNT(*) FROM suppliers"

check "products" \
  "SELECT COUNT(*) FROM products p WHERE $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM products"

check "product_attributes" \
  "SELECT COUNT(*) FROM product_attributes pa JOIN products p ON p.id = pa.product_id WHERE $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM product_attributes"

check "product_barcodes" \
  "SELECT COUNT(*) FROM product_barcodes pb JOIN products p ON p.id = pb.product_id WHERE $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM product_barcodes"

check "store_stock" \
  "SELECT COUNT(*) FROM store_stock ss JOIN products p ON p.id = ss.product_id WHERE $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM store_stock"

check "stock_receipts" \
  "SELECT COUNT(*) FROM stock_receipts sr JOIN stores st ON st.id = sr.store_id WHERE $STORE_FILTER" \
  "SELECT COUNT(*) FROM stock_receipts"

check "stock_receipt_lines" \
  "SELECT COUNT(*) FROM stock_receipt_lines srl JOIN stock_receipts sr ON sr.id = srl.receipt_id JOIN stores st ON st.id = sr.store_id JOIN products p ON p.id = srl.product_id WHERE $STORE_FILTER AND $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM stock_receipt_lines"

check "stock_lots" \
  "SELECT COUNT(*) FROM stock_lots sl JOIN products p ON p.id = sl.product_id JOIN stores st ON st.id = sl.store_id WHERE $STORE_FILTER AND $PRODUCT_FILTER" \
  "SELECT COUNT(*) FROM stock_lots"

check "sales" \
  "SELECT COUNT(*) FROM sales sa JOIN stores st ON st.id = sa.store_id WHERE $STORE_FILTER" \
  "SELECT COUNT(*) FROM sales"

check "sale_items" \
  "SELECT COUNT(*) FROM sale_items si JOIN sales sa ON sa.id = si.sale_id JOIN stores st ON st.id = sa.store_id WHERE $STORE_FILTER" \
  "SELECT COUNT(*) FROM sale_items"

check "sale_item_lots" \
  "SELECT COUNT(*) FROM sale_item_lots sil JOIN sale_items si ON si.id = sil.sale_item_id JOIN sales sa ON sa.id = si.sale_id JOIN stores st ON st.id = sa.store_id WHERE $STORE_FILTER" \
  "SELECT COUNT(*) FROM sale_item_lots"

echo
echo "=== Quantity sanity (lots) ==="
POS_LOT_QTY=$(psql_q "$POS_DSN" "SELECT COALESCE(SUM(sl.quantity),0) FROM stock_lots sl JOIN products p ON p.id = sl.product_id JOIN stores st ON st.id = sl.store_id WHERE $STORE_FILTER AND $PRODUCT_FILTER")
PHARM_LOT_QTY=$(psql_q "$PHARM_DSN" "SELECT COALESCE(SUM(quantity),0) FROM stock_lots")
if [[ "$POS_LOT_QTY" == "$PHARM_LOT_QTY" ]]; then
  printf 'OK   %-22s pos=%-8s pharmacy=%s\n' "stock_lots.qty_sum" "$POS_LOT_QTY" "$PHARM_LOT_QTY"
else
  printf 'DIFF %-22s pos=%-8s pharmacy=%s\n' "stock_lots.qty_sum" "$POS_LOT_QTY" "$PHARM_LOT_QTY"
  FAIL=1
fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "All checks passed."
  exit 0
fi
echo "Mismatch detected — investigate before cutting over."
exit 1
