package com.pos.restaurant.analytics.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class DashboardDeltaMath {

    private DashboardDeltaMath() {
    }

    /** Percent change: (current - previous) / previous * 100. Null if previous is zero. */
    public static BigDecimal percentDelta(BigDecimal current, BigDecimal previous) {
        BigDecimal cur = current == null ? BigDecimal.ZERO : current;
        BigDecimal prev = previous == null ? BigDecimal.ZERO : previous;
        if (prev.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return cur.subtract(prev)
            .multiply(BigDecimal.valueOf(100))
            .divide(prev, 1, RoundingMode.HALF_UP);
    }

    public static long absoluteDelta(long current, long previous) {
        return current - previous;
    }
}
