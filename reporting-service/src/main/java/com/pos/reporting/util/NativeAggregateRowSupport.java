package com.pos.reporting.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Hibernate / Spring Data native aggregate queries sometimes return a nested {@code Object[]}
 * or a {@code List} with one row. Always normalize before reading columns.
 */
public final class NativeAggregateRowSupport {

    private NativeAggregateRowSupport() {
    }

    public static Object[] normalize(Object raw) {
        if (raw == null) {
            return new Object[0];
        }
        if (raw instanceof List<?> list) {
            if (list.isEmpty()) {
                return new Object[0];
            }
            return normalize(list.get(0));
        }
        if (!(raw instanceof Object[] row)) {
            return new Object[]{raw};
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
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return toBigDecimal(row[index]);
    }

    public static Integer toInteger(Object[] row, int index) {
        if (row == null || row.length <= index || row[index] == null) {
            return null;
        }
        return (int) toLong(row[index]);
    }

    public static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Object[] arr && arr.length > 0) {
            return toLong(arr[0]);
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return 0L;
        }
        return new BigDecimal(text).longValue();
    }

    public static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Object[] arr && arr.length > 0) {
            return toBigDecimal(arr[0]);
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }
        String text = value.toString().trim();
        if (text.isEmpty() || text.startsWith("[") || text.startsWith("{")) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(text).setScale(2, RoundingMode.HALF_UP);
    }
}
