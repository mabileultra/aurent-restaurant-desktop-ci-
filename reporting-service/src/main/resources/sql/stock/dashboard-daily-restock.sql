SELECT
    CAST(m.transaction_date AS varchar),
    COALESCE(SUM(CASE WHEN m.quantity > 0 THEN m.quantity ELSE 0 END), 0)
FROM stock_movement_facts m
WHERE m.company_id = :companyId
  AND m.transaction_date BETWEEN :from AND :to
  AND (:storeId IS NULL OR m.store_id = :storeId)
  AND m.movement_type = 'RESTOCK'
GROUP BY m.transaction_date
ORDER BY m.transaction_date
