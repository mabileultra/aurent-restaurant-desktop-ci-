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
    COALESCE(SUM(GREATEST(COALESCE(sb.stock_qty, 0), 0)), 0) AS stock_units,
    COALESCE(SUM(GREATEST(COALESCE(sb.stock_qty, 0), 0) * p.cost_price), 0) AS stock_cost
FROM product_snapshot_facts p
LEFT JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
