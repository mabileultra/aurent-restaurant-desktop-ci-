WITH period_agg AS (
    SELECT product_id
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
      AND transaction_date >= :from
      AND transaction_date <= :to
    GROUP BY product_id
),
closing AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
      AND transaction_date <= :to
    GROUP BY product_id
)
SELECT COUNT(*)
FROM product_snapshot_facts p
LEFT JOIN period_agg pa ON pa.product_id = p.product_id
LEFT JOIN closing c ON c.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND (:categoryId < 0 OR p.category_id = :categoryId)
  AND (
    CAST(:searchPattern AS text) = ''
    OR LOWER(p.product_name) LIKE LOWER(CAST(:searchPattern AS text))
    OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CAST(:searchPattern AS text))
  )
  AND (
    pa.product_id IS NOT NULL
    OR COALESCE(c.qty, 0) <> 0
  )
