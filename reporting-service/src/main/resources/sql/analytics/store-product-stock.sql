SELECT
    CAST(m.product_id AS varchar) AS product_id,
    m.store_id,
    MAX(m.store_name) AS store_name,
    MAX(m.product_name) AS product_name,
    COALESCE(SUM(m.quantity), 0) AS stock_qty
FROM stock_movement_facts m
WHERE m.company_id = :companyId
  AND m.product_id IS NOT NULL
  AND m.store_id IS NOT NULL
GROUP BY m.product_id, m.store_id
HAVING COALESCE(SUM(m.quantity), 0) != 0
