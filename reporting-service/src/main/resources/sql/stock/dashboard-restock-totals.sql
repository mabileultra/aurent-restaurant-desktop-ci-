SELECT
    COALESCE(SUM(CASE WHEN m.quantity > 0 THEN m.quantity ELSE 0 END), 0) AS received_units,
    COALESCE(SUM(
        CASE
            WHEN m.quantity > 0 THEN m.quantity * COALESCE(m.unit_cost_estimate, p.cost_price, 0)
            ELSE 0
        END
    ), 0) AS received_cost
FROM stock_movement_facts m
LEFT JOIN product_snapshot_facts p
  ON p.product_id = m.product_id
 AND p.company_id = m.company_id
WHERE m.company_id = :companyId
  AND m.transaction_date BETWEEN :from AND :to
  AND (:storeId IS NULL OR m.store_id = :storeId)
  AND m.movement_type = 'RESTOCK'
