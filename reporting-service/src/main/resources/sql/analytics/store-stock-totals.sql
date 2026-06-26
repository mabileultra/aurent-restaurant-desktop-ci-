SELECT
    m.store_id,
    MAX(m.store_name) AS store_name,
    COALESCE(SUM(m.quantity), 0) AS stock_qty
FROM stock_movement_facts m
WHERE m.company_id = :companyId
  AND m.store_id IS NOT NULL
GROUP BY m.store_id
