package com.pos.pharmacy.marks.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockMarkMonitorSqlTest {

    @Test
    void searchCastsMarkCodeWithoutPostgresColonSyntax() {
        // Hibernate treats ":text" in "mark_code::text" as a named parameter → SQL syntax error
        assertFalse(StockMarkMonitorSql.SELECT.contains("::"));
        assertFalse(StockMarkMonitorSql.COUNT.contains("::"));
        assertTrue(StockMarkMonitorSql.SELECT.contains("lower(CAST(sm.mark_code AS TEXT))"));
        assertTrue(StockMarkMonitorSql.COUNT.contains("lower(CAST(sm.mark_code AS TEXT))"));
    }
}
