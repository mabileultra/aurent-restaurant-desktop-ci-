SELECT u.full_name AS cashierName,
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
       ), 0) AS revenue
FROM sales s
INNER JOIN users u ON u.id = s.cashier_id
WHERE CAST(s.created_at AS date) BETWEEN :fromDate AND :toDate
AND s.status IN ('COMPLETED', 'REFUNDED')
AND s.company_id = :companyId
GROUP BY u.id, u.full_name
ORDER BY revenue DESC
