WITH stock_balance AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS stock_qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
    GROUP BY product_id
),
last_sale AS (
    SELECT
        product_id,
        MAX(transaction_date) AS last_sale_date
    FROM sale_item_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
      AND (quantity - quantity_returned) > 0
    GROUP BY product_id
)
SELECT
    CAST(p.product_id AS varchar) AS product_id,
    p.product_name,
    COALESCE(p.sku, '') AS sku,
    COALESCE(p.barcode, '') AS barcode,
    COALESCE(p.category_name, '') AS category_name,
    sb.stock_qty,
    sb.stock_qty * COALESCE(
        NULLIF(p.cost_price, 0),
        (
            SELECT AVG(ABS(m.unit_cost_estimate))
            FROM stock_movement_facts m
            WHERE m.company_id = p.company_id
              AND m.product_id = p.product_id
              AND m.unit_cost_estimate IS NOT NULL
              AND m.unit_cost_estimate > 0
        ),
        0
    ) AS stock_value,
    ls.last_sale_date,
    CASE
        WHEN ls.last_sale_date IS NULL THEN :daysNoSale
        ELSE GREATEST(0, CAST(:asOfDate AS date) - ls.last_sale_date)
    END AS days_without_sale
FROM product_snapshot_facts p
INNER JOIN stock_balance sb ON sb.product_id = p.product_id
LEFT JOIN last_sale ls ON ls.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND sb.stock_qty > 0
  AND (:categoryId < 0 OR p.category_id = :categoryId)
  AND (
    CAST(:searchPattern AS text) = ''
    OR LOWER(p.product_name) LIKE LOWER(CAST(:searchPattern AS text))
    OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CAST(:searchPattern AS text))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CAST(:searchPattern AS text))
  )
  AND (
    ls.last_sale_date IS NULL
    OR ls.last_sale_date <= :cutoffDate
  )
ORDER BY days_without_sale DESC, sb.stock_qty DESC
