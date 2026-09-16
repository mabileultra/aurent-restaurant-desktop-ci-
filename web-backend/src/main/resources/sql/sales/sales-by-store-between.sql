SELECT s.store_id,
       COALESCE(st.name, '—') AS store_name,
       COALESCE(SUM(
           CASE s.status
               WHEN 'COMPLETED' THEN s.total_amount
               WHEN 'REFUNDED' THEN GREATEST(
                   0,
                   s.total_amount - COALESCE((
                       SELECT SUM(
                           CASE
                               WHEN si.quantity <= 0 THEN 0
                               WHEN si.returned_quantity >= si.quantity THEN si.line_total
                               ELSE ROUND(si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity, 2)
                           END
                       )
                       FROM sale_items si
                       WHERE si.sale_id = s.id
                   ), 0)
               )
               ELSE 0
           END
       ), 0) AS revenue,
       COUNT(*) AS checks
FROM sales s
LEFT JOIN stores st ON st.id = s.store_id
WHERE s.created_at >= :start
  AND s.created_at < :end
  AND s.status IN ('COMPLETED', 'REFUNDED')
  AND s.company_id = :companyId
GROUP BY s.store_id, st.name
ORDER BY revenue DESC
