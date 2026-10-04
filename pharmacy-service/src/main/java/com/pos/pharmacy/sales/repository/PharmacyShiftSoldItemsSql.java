package com.pos.pharmacy.sales.repository;

/**
 * Net goods on a pharmacy shift: whole shift, completed and partial refunds,
 * fully returned lines dropped. Same money rules as the product shift slip.
 */
public final class PharmacyShiftSoldItemsSql {

    public static final String QUERY = """
        SELECT i.product_name,
               SUM(GREATEST(0, i.quantity - COALESCE(i.returned_quantity, 0))),
               SUM(
                   CASE
                       WHEN i.quantity <= 0 THEN 0
                       WHEN COALESCE(i.returned_quantity, 0) >= i.quantity THEN 0
                       ELSE ROUND(
                           i.line_total * (i.quantity - COALESCE(i.returned_quantity, 0)) / i.quantity,
                           2
                       )
                   END
               )
        FROM sale_items i
        JOIN sales s ON s.id = i.sale_id
        WHERE s.company_id = :companyId
          AND s.cashier_shift_id = :shiftId
          AND s.status IN ('COMPLETED', 'REFUNDED')
        GROUP BY i.product_name
        HAVING SUM(GREATEST(0, i.quantity - COALESCE(i.returned_quantity, 0))) > 0
        ORDER BY 2 DESC, i.product_name
        """;

    private PharmacyShiftSoldItemsSql() {}
}
