package com.pos.platform.service.support;

import com.pos.platform.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

public final class BillingMoney {

    private BillingMoney() {}

    public static BigDecimal of(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String normalizePlanCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Код тарифа обязателен");
        }
        return code.trim().toLowerCase(Locale.ROOT);
    }
}
