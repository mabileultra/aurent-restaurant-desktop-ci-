SELECT
    COALESCE(SUM(ABS(m.quantity)), 0) AS write_off_units,
    COALESCE(SUM(ABS(m.quantity) * COALESCE(m.unit_cost_estimate, p.cost_price, 0)), 0) AS write_off_cost
FROM stock_movement_facts m
LEFT JOIN product_snapshot_facts p
    ON p.product_id = m.product_id
   AND p.company_id = m.company_id
WHERE m.company_id = :companyId
  AND m.movement_type = 'WRITE_OFF'
  AND m.transaction_date >= :from
  AND m.transaction_date <= :to
  AND (:storeId < 0 OR m.store_id = :storeId)
