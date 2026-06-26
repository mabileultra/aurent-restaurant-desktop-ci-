WITH stock_balance AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS stock_qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
    GROUP BY product_id
)
SELECT
    CAST(p.product_id AS varchar) AS product_id,
    p.product_name,
    COALESCE(p.sku, '') AS sku,
    COALESCE(p.barcode, '') AS barcode,
    COALESCE(sb.stock_qty, 0) AS stock_qty,
    p.low_stock_alert,
    GREATEST(0, p.low_stock_alert - COALESCE(sb.stock_qty, 0)) AS deficit,
    p.cost_price,
    COALESCE(sb.stock_qty, 0) * p.cost_price AS stock_value
FROM product_snapshot_facts p
LEFT JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND COALESCE(sb.stock_qty, 0) < p.low_stock_alert
ORDER BY (p.low_stock_alert - COALESCE(sb.stock_qty, 0)) DESC, p.product_name ASC
