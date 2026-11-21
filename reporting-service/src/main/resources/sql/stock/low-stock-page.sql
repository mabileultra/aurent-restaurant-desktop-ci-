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
SELECT
    CAST(p.product_id AS varchar) AS product_id,
    p.product_name,
    COALESCE(p.sku, '') AS sku,
    COALESCE(p.barcode, '') AS barcode,
    sb.stock_qty AS stock_qty,
    p.low_stock_alert,
    GREATEST(0, p.low_stock_alert - sb.stock_qty) AS deficit,
    p.cost_price,
    sb.stock_qty * p.cost_price AS stock_value
FROM product_snapshot_facts p
INNER JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND sb.stock_qty <= p.low_stock_alert
ORDER BY (p.low_stock_alert - sb.stock_qty) DESC, p.product_name ASC
