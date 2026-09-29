package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.BusinessException;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ServicePercentRules {

    private static final BigDecimal HUNDRED = new BigDecimal("100.00");

    private ServicePercentRules() {
    }

    public static BigDecimal required(BigDecimal percent) {
        if (percent == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return normalize(percent);
    }

    public static BigDecimal optional(BigDecimal percent) {
        if (percent == null) {
            return null;
        }
        return normalize(percent);
    }

    public static BigDecimal amount(BigDecimal subtotal, BigDecimal percent) {
        BigDecimal base = subtotal == null ? BigDecimal.ZERO : subtotal;
        BigDecimal rate = percent == null ? BigDecimal.ZERO : percent;
        return base.multiply(rate).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal normalize(BigDecimal percent) {
        BigDecimal value = percent.setScale(2, RoundingMode.HALF_UP);
        if (value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(HUNDRED) > 0) {
            throw new BusinessException("Service percent must be between 0 and 100");
        }
        return value;
    }
}
