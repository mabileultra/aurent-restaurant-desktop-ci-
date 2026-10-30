package com.pos.taxanalytics.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class TaxAnalyticsWeekMath {

    private TaxAnalyticsWeekMath() {
    }

    public static BigDecimal decimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.toString());
    }

    public static BigDecimal deltaAmount(BigDecimal current, BigDecimal previous) {
        BigDecimal cur = current == null ? BigDecimal.ZERO : current;
        BigDecimal prev = previous == null ? BigDecimal.ZERO : previous;
        return cur.subtract(prev);
    }

    public static BigDecimal deltaPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        BigDecimal cur = current == null ? BigDecimal.ZERO : current;
        return cur.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 1, RoundingMode.HALF_UP);
    }
}
