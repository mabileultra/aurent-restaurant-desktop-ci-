package com.pos.reporting.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Hibernate / Spring Data native aggregate queries sometimes return a nested {@code Object[]}.
 */
public final class NativeAggregateRowSupport {

    private NativeAggregateRowSupport() {
    }

    public static Object[] normalize(Object raw) {
        if (!(raw instanceof Object[] row)) {
            return new Object[0];
        }
        if (row.length == 1 && row[0] instanceof Object[] nested) {
            return nested;
        }
        return row;
    }

    public static long toLong(Object[] row, int index) {
        if (row == null || row.length <= index) {
            return 0L;
        }
        return toLong(row[index]);
    }

    public static BigDecimal toBigDecimal(Object[] row, int index) {
        if (row == null || row.length <= index) {
            return BigDecimal.ZERO;
        }
        return toBigDecimal(row[index]);
    }

    public static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    public static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }
}
