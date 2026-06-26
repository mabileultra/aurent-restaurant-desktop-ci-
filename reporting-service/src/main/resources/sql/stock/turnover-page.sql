WITH stock_balance AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS stock_qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
    GROUP BY product_id
),
opening AS (
    SELECT
        product_id,
        COALESCE(SUM(quantity), 0) AS qty
    FROM stock_movement_facts
    WHERE company_id = :companyId
      AND product_id IS NOT NULL
      AND transaction_date < :from
    GROUP BY product_id
),
period_agg AS (
    SELECT
        product_id,
        COALESCE(SUM(CASE WHEN movement_type = 'RESTOCK' AND quantity > 0 THEN quantity ELSE 0 END), 0) AS received_qty,
        COALESCE(SUM(CASE WHEN movement_type = 'RETURN' AND quantity > 0 THEN quantity ELSE 0 END), 0) AS returned_qty,
        COALESCE(SUM(CASE WHEN movement_type = 'SALE' AND quantity < 0 THEN -quantity ELSE 0 END), 0) AS sold_qty,
        COALESCE(SUM(CASE WHEN movement_type = 'WRITE_OFF' AND quantity < 0 THEN -quantity ELSE 0 END), 0) AS write_off_qty,
        COALESCE(SUM(CASE WHEN movement_type = 'ADJUSTMENT' THEN quantity ELSE 0 END), 0) AS adjustment_qty
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
SELECT
    CAST(p.product_id AS varchar) AS product_id,
    p.product_name,
    COALESCE(p.sku, '') AS sku,
    COALESCE(p.category_name, '') AS category_name,
    COALESCE(o.qty, 0) AS opening_qty,
    COALESCE(pa.received_qty, 0) AS received_qty,
    COALESCE(pa.returned_qty, 0) AS returned_qty,
    COALESCE(pa.sold_qty, 0) AS sold_qty,
    COALESCE(pa.write_off_qty, 0) AS write_off_qty,
    COALESCE(pa.adjustment_qty, 0) AS adjustment_qty,
    COALESCE(c.qty, 0) AS closing_qty,
    COALESCE(c.qty, 0) * p.cost_price AS closing_cost
FROM product_snapshot_facts p
LEFT JOIN opening o ON o.product_id = p.product_id
LEFT JOIN period_agg pa ON pa.product_id = p.product_id
LEFT JOIN closing c ON c.product_id = p.product_id
WHERE p.company_id = :companyId
  AND p.is_active = true
  AND (:categoryId < 0 OR p.category_id = :categoryId)
  AND (
    :search = ''
    OR LOWER(p.product_name) LIKE LOWER(CONCAT('%', :search, '%'))
    OR LOWER(COALESCE(p.sku, '')) LIKE LOWER(CONCAT('%', :search, '%'))
  )
  AND (
    COALESCE(pa.received_qty, 0) <> 0
    OR COALESCE(pa.returned_qty, 0) <> 0
    OR COALESCE(pa.sold_qty, 0) <> 0
    OR COALESCE(pa.write_off_qty, 0) <> 0
    OR COALESCE(pa.adjustment_qty, 0) <> 0
    OR COALESCE(c.qty, 0) <> 0
  )
ORDER BY p.product_name ASC
