package com.pos.pharmacy.sales.repository;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyShiftSoldItemsSqlTest {

    @Test
    void coversTheWholeShiftAndNetsReturns() {
        String query = PharmacyShiftSoldItemsSql.QUERY;

        assertTrue(query.contains("s.company_id = :companyId"));
        assertTrue(query.contains("s.cashier_shift_id = :shiftId"));
        assertTrue(query.contains("s.status IN ('COMPLETED', 'REFUNDED')"));
        assertFalse(query.contains("VOIDED"));
        assertFalse(query.contains("created_at"));
        assertTrue(query.contains("i.quantity - COALESCE(i.returned_quantity, 0)"));
        assertTrue(query.contains("i.line_total * (i.quantity - COALESCE(i.returned_quantity, 0)) / i.quantity"));
        assertTrue(query.contains("HAVING SUM(GREATEST(0, i.quantity - COALESCE(i.returned_quantity, 0))) > 0"));
        assertTrue(query.contains("ORDER BY 2 DESC, i.product_name"));
    }
}
