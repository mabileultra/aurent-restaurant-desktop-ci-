package com.pos.reporting.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NativeAggregateRowSupportTest {

    @Test
    void unwrapsNestedSingleRowObjectArray() {
        Object[] nested = new Object[]{new BigDecimal("10.50"), 3L};
        Object[] row = NativeAggregateRowSupport.normalize(new Object[]{nested});
        assertEquals(new BigDecimal("10.50"), NativeAggregateRowSupport.toBigDecimal(row, 0));
        assertEquals(3L, NativeAggregateRowSupport.toLong(row, 1));
    }

    @Test
    void doesNotParseObjectArrayAsBigDecimal() {
        Object[] nested = new Object[]{new BigDecimal("7.00")};
        assertEquals(new BigDecimal("7.00"), NativeAggregateRowSupport.toBigDecimal(nested));
    }
}
