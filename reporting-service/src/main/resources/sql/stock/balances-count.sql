WITH stock_balance AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS stock_qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
    GROUP BY product_id
)
SELECT COUNT(*)
FROM product_snapshot_facts p
LEFT JOIN stock_balance sb ON sb.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND (:onlyWithStock = 0 OR COALESCE(sb.stock_qty, 0) > 0)
  AND (:categoryId < 0 OR p.category_id = :categoryId)
  AND (
    CAST(:searchPattern AS text) = ''
    OR LOWER(p.product_name) LIKE LOWER(CAST(:searchPattern AS text))
    OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CAST(:searchPattern AS text))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CAST(:searchPattern AS text))
  )
