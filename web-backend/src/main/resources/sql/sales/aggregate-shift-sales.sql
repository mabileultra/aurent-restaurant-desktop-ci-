SELECT COUNT(*),
       COALESCE(SUM(net.total_amount), 0),
       COALESCE(SUM(net.tax_total), 0),
       COALESCE(SUM(net.discount_total), 0),
       COALESCE(SUM(net.cash_amount), 0),
       COALESCE(SUM(net.card_amount), 0)
FROM sales s
CROSS JOIN LATERAL (
    SELECT
        CASE
            WHEN s.status IN ('COMPLETED', 'REFUNDED') THEN GREATEST(0, s.total_amount - returned.amount)
            ELSE 0
        END AS total_amount,
        CASE
            WHEN s.status IN ('COMPLETED', 'REFUNDED') THEN ROUND(COALESCE(s.tax_total, 0) * returned.ratio, 2)
            ELSE 0
        END AS tax_total,
        CASE
            WHEN s.status IN ('COMPLETED', 'REFUNDED') THEN ROUND(COALESCE(s.discount_total, 0) * returned.ratio, 2)
            ELSE 0
        END AS discount_total,
        CASE
            WHEN s.status IN ('COMPLETED', 'REFUNDED') THEN ROUND(COALESCE(s.cash_amount, 0) * returned.ratio, 2)
            ELSE 0
        END AS cash_amount,
        CASE
            WHEN s.status IN ('COMPLETED', 'REFUNDED') THEN ROUND(COALESCE(s.card_amount, 0) * returned.ratio, 2)
            ELSE 0
        END AS card_amount
    FROM (
        SELECT
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN si.quantity <= 0 THEN 0
                        WHEN si.returned_quantity >= si.quantity THEN si.line_total
                        ELSE ROUND(si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity, 2)
                    END
                )
                FROM sale_items si
                WHERE si.sale_id = s.id
            ), 0) AS amount,
            CASE
                WHEN s.status NOT IN ('COMPLETED', 'REFUNDED') THEN 0
                WHEN s.total_amount IS NULL OR s.total_amount = 0 THEN 0
                ELSE GREATEST(0, s.total_amount - COALESCE((
                    SELECT SUM(
                        CASE
                            WHEN si.quantity <= 0 THEN 0
                            WHEN si.returned_quantity >= si.quantity THEN si.line_total
                            ELSE ROUND(si.line_total * CAST(si.returned_quantity AS DECIMAL) / si.quantity, 2)
                        END
                    )
                    FROM sale_items si
                    WHERE si.sale_id = s.id
                ), 0)) / s.total_amount
            END AS ratio
    ) returned
) net
WHERE s.cashier_id = :cashierId
  AND s.store_id = :storeId
  AND s.status IN ('COMPLETED', 'REFUNDED')
  AND s.created_at >= :from
  AND s.created_at < :to
