package com.pos.reporting.sql;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Native dashboard SQL is bound via {@code NativeQueryParamSupport} (null → -1).
 * Filters must use {@code :storeId < 0}, never {@code :storeId IS NULL}.
 */
class StockDashboardStoreFilterSqlTest {

    @Test
    void restockTotalsUsesSentinelStoreFilter() throws IOException {
        assertSentinelStoreFilter("sql/stock/dashboard-restock-totals.sql");
    }

    @Test
    void dailyRestockUsesSentinelStoreFilter() throws IOException {
        assertSentinelStoreFilter("sql/stock/dashboard-daily-restock.sql");
    }

    @Test
    void writeOffTotalsUsesSentinelStoreFilter() throws IOException {
        assertSentinelStoreFilter("sql/stock/dashboard-write-off-totals.sql");
    }

    @Test
    void currentStockUsesSentinelStoreFilter() throws IOException {
        assertSentinelStoreFilter("sql/stock/dashboard-current-stock-totals.sql");
    }

    @Test
    void lowStockCountUsesSentinelStoreFilter() throws IOException {
        assertSentinelStoreFilter("sql/stock/low-stock-count.sql");
    }

    @Test
    void lowStockCountRequiresMovementJoin() throws IOException {
        String sql = load("sql/stock/low-stock-count.sql");
        assertTrue(sql.toUpperCase().contains("INNER JOIN STOCK_BALANCE"), sql);
        assertFalse(sql.toUpperCase().contains("LEFT JOIN STOCK_BALANCE"), sql);
    }

    private static void assertSentinelStoreFilter(String classpathResource) throws IOException {
        String sql = load(classpathResource);
        assertTrue(sql.contains(":storeId < 0"), () -> "expected :storeId < 0 in " + classpathResource);
        assertFalse(
            sql.contains(":storeId IS NULL"),
            () -> "must not use :storeId IS NULL with sentinel binder in " + classpathResource
        );
    }

    private static String load(String classpathResource) throws IOException {
        try (var in = StockDashboardStoreFilterSqlTest.class.getClassLoader().getResourceAsStream(classpathResource)) {
            if (in == null) {
                throw new IOException("Missing classpath resource: " + classpathResource);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
