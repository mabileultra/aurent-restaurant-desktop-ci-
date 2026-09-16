package com.pos.pharmacy.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class MoneyCalculator {

    public static final int SCALE = 2;

    private MoneyCalculator() {}

    public static BigDecimal round(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal lineGross(BigDecimal unitPrice, BigDecimal quantity, BigDecimal lineDiscount) {
        BigDecimal price = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        BigDecimal qty = QuantityUtil.normalize(quantity);
        BigDecimal gross = round(price.multiply(qty));
        BigDecimal discount = lineDiscount != null ? lineDiscount : BigDecimal.ZERO;
        return round(gross.subtract(discount).max(BigDecimal.ZERO));
    }

    public static BigDecimal vatFromInclusiveLine(BigDecimal inclusiveLineTotal, BigDecimal taxRatePercent) {
        if (inclusiveLineTotal == null || inclusiveLineTotal.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = taxRatePercent != null ? taxRatePercent : BigDecimal.ZERO;
        if (rate.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return round(inclusiveLineTotal.multiply(rate)
            .divide(rate.add(BigDecimal.valueOf(100)), 8, RoundingMode.HALF_UP));
    }
}
