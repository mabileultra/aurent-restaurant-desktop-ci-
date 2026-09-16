package com.pos.pharmacy.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class QuantityUtil {

    public static final int SCALE = 3;

    private QuantityUtil() {}

    public static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    public static BigDecimal add(BigDecimal a, BigDecimal b) {
        return normalize(normalize(a).add(normalize(b)));
    }

    public static BigDecimal subtract(BigDecimal a, BigDecimal b) {
        return normalize(normalize(a).subtract(normalize(b)));
    }
}
