package com.pos.sales.service.cashier.support;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShiftSoldItemsSqlContractTest {

    @Test
    void productSlipUsesTheClosingZPeriodAndNetsReturns() throws IOException {
        String byShift = sql("sql/sales/aggregate-shift-sold-items-by-shift-id.sql");
        String byCashier = sql("sql/sales/aggregate-shift-sold-items-by-cashier-time.sql");

        for (String query : new String[] { byShift, byCashier }) {
            assertTrue(query.contains("si.quantity - COALESCE(si.returned_quantity, 0)"));
            assertTrue(query.contains("si.line_total * (si.quantity - COALESCE(si.returned_quantity, 0)) / si.quantity"));
            assertTrue(query.contains("s.status IN ('COMPLETED', 'REFUNDED')"));
            assertFalse(query.contains("VOIDED"));
            assertTrue(query.contains("HAVING SUM(GREATEST(0, si.quantity - COALESCE(si.returned_quantity, 0))) > 0"));
            assertTrue(query.contains("ORDER BY 2 DESC, si.product_name"));
        }

        assertTrue(byShift.contains("s.cashier_shift_id = :shiftId"));
        assertTrue(byShift.contains("s.created_at >= :periodFrom"));
        assertTrue(byShift.contains("s.created_at < :reportAt"));
        assertFalse(byShift.contains("s.created_at <="));

        assertTrue(byCashier.contains("s.cashier_id = :cashierId"));
        assertTrue(byCashier.contains("s.store_id = :storeId"));
        assertTrue(byCashier.contains("s.created_at >= :from"));
        assertTrue(byCashier.contains("s.created_at < :to"));
    }

    private static String sql(String path) throws IOException {
        try (InputStream in = ShiftSoldItemsSqlContractTest.class.getClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalStateException("Missing " + path);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
