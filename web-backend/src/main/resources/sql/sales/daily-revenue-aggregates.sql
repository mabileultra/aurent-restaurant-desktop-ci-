SELECT CAST(s.created_at AS date) AS day,
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
                               ELSE ROUND(
                                   si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity,
                                   2
                               )
                           END
                       )
                       FROM sale_items si
                       WHERE si.sale_id = s.id
                   ), 0)
               )
               ELSE 0
           END
       ), 0) AS revenue,
       COUNT(*) AS tx_count
FROM sales s
WHERE s.created_at >= :start AND s.created_at < :end
  AND s.status IN ('COMPLETED', 'REFUNDED')
  AND (
    s.company_id = :companyId
    OR (
      s.company_id IS NULL
      AND EXISTS (
        SELECT 1 FROM stores st
        WHERE st.id = s.store_id AND st.company_id = :companyId
      )
    )
  )
GROUP BY CAST(s.created_at AS date)
ORDER BY day
