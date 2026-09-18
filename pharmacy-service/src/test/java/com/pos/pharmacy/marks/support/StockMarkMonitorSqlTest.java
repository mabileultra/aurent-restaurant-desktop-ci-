package com.pos.pharmacy.marks.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockMarkMonitorSqlTest {

    @Test
    void searchCastsMarkCodeToText() {
        assertTrue(StockMarkMonitorSql.SELECT.contains("lower(sm.mark_code::text)"));
        assertTrue(StockMarkMonitorSql.COUNT.contains("lower(sm.mark_code::text)"));
        assertFalse(StockMarkMonitorSql.SELECT.contains("LOWER(m.markCode)"));
    }
}
