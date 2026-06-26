SELECT
    CAST(m.transaction_date AS varchar) AS day_key,
    COALESCE(SUM(ABS(m.quantity)), 0) AS write_off_units
FROM stock_movement_facts m
WHERE m.company_id = :companyId
  AND m.movement_type = 'WRITE_OFF'
  AND m.transaction_date >= :from
  AND m.transaction_date <= :to
  AND (:storeId < 0 OR m.store_id = :storeId)
GROUP BY m.transaction_date
ORDER BY m.transaction_date
