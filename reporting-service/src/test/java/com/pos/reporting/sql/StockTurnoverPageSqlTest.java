package com.pos.reporting.sql;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;

class StockTurnoverPageSqlTest {

    @Test
    void turnoverPageSelectsLastMovementAndOrdersNewestFirst() throws IOException {
        String sql = load("sql/stock/turnover-page.sql");
        assertTrue(sql.contains("MAX(created_at) AS last_movement_at"), sql);
        assertTrue(sql.contains("pa.last_movement_at AS last_movement_at"), sql);
        assertTrue(sql.contains("ORDER BY pa.last_movement_at DESC NULLS LAST"), sql);
    }

    private static String load(String classpath) throws IOException {
        try (var in = StockTurnoverPageSqlTest.class.getClassLoader().getResourceAsStream(classpath)) {
            if (in == null) {
                throw new IOException("Missing classpath resource: " + classpath);
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
