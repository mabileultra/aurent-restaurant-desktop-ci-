SELECT si.product_name,
       SUM(GREATEST(0, si.quantity - COALESCE(si.returned_quantity, 0))),
       SUM(
           CASE
               WHEN si.quantity <= 0 THEN 0
               WHEN COALESCE(si.returned_quantity, 0) >= si.quantity THEN 0
               ELSE ROUND(
                   si.line_total * (si.quantity - COALESCE(si.returned_quantity, 0)) / si.quantity,
                   2
               )
           END
       )
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.cashier_id = :cashierId
  AND s.store_id = :storeId
  AND s.created_at >= :from
  AND s.created_at < :to
  AND s.status IN ('COMPLETED', 'REFUNDED')
GROUP BY si.product_name
HAVING SUM(GREATEST(0, si.quantity - COALESCE(si.returned_quantity, 0))) > 0
ORDER BY 2 DESC, si.product_name
