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
    COALESCE(SUM(GREATEST(COALESCE(sb.stock_qty, 0), 0)), 0) AS stock_units,
    COALESCE(SUM(
        GREATEST(COALESCE(sb.stock_qty, 0), 0) * COALESCE(
            NULLIF(p.cost_price, 0),
            (
                SELECT AVG(ABS(m.unit_cost_estimate))
                FROM stock_movement_facts m
                WHERE m.company_id = p.company_id
                  AND m.product_id = p.product_id
                  AND (:storeId < 0 OR m.store_id = :storeId)
                  AND m.unit_cost_estimate IS NOT NULL
                  AND m.unit_cost_estimate > 0
            ),
            0
        )
    ), 0) AS stock_cost,
    COALESCE(SUM(
        GREATEST(COALESCE(sb.stock_qty, 0), 0) * COALESCE(p.selling_price, 0)
    ), 0) AS stock_retail
FROM product_snapshot_facts p
LEFT JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
