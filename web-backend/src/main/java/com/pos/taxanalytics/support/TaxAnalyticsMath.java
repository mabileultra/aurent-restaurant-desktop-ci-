package com.pos.taxanalytics.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class TaxAnalyticsMath {

    private TaxAnalyticsMath() {
    }

    public static BigDecimal share(long part, long total) {
        if (total <= 0) {
            return null;
        }
        return BigDecimal.valueOf(part * 100.0 / total).setScale(1, RoundingMode.HALF_UP);
    }

    public static BigDecimal shareAmount(BigDecimal part, BigDecimal total) {
        if (total == null || total.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP);
    }

    public static BigDecimal deltaPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous, 1, RoundingMode.HALF_UP);
    }
}
