WITH stock_balance AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS stock_qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
      AND (:storeId < 0 OR store_id = :storeId)
    GROUP BY product_id
)
-- Only SKUs that actually moved in scope (приход/движение).
-- Empty store with no movements → 0, not "all catalog at zero".
SELECT COUNT(*)
FROM product_snapshot_facts p
INNER JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND sb.stock_qty <= p.low_stock_alert
