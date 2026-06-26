SELECT
    CAST(i.product_id AS varchar) AS product_id,
    i.store_id,
    MAX(i.product_name) AS product_name,
    COALESCE(SUM(i.quantity - i.quantity_returned), 0) AS sold_units
FROM sale_item_facts i
WHERE i.company_id = :companyId
  AND i.transaction_date BETWEEN :from AND :to
  AND i.product_id IS NOT NULL
  AND i.store_id IS NOT NULL
GROUP BY i.product_id, i.store_id
HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
