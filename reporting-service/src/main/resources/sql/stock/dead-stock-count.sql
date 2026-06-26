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
SELECT COUNT(*)
FROM product_snapshot_facts p
INNER JOIN stock_balance sb ON sb.product_id = p.product_id
LEFT JOIN last_sale ls ON ls.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND sb.stock_qty > 0
  AND (:categoryId < 0 OR p.category_id = :categoryId)
  AND (
    :search = ''
    OR LOWER(p.product_name) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
  )
  AND (
    ls.last_sale_date IS NULL
    OR ls.last_sale_date <= :cutoffDate
  )
