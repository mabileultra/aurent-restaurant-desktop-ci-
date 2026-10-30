package com.pos.platform.service.support.payme;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public final class PaymeParamCodec {

    private PaymeParamCodec() {}

    public static String paymeId(Map<String, Object> params) {
        Object raw = params.get("id");
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw).trim();
        if (value.isEmpty() || "null".equals(value)) {
            return null;
        }
        return value;
    }

    /** Payme amount is in tiyin; null if missing or not positive. */
    public static Long requirePositiveTiyin(Object raw) {
        BigDecimal amount = toDecimal(raw);
        if (amount == null || amount.signum() <= 0) {
            return null;
        }
        try {
            return amount.longValueExact();
        } catch (ArithmeticException e) {
            return null;
        }
    }

    public static BigDecimal fromTiyin(long amountTiyin) {
        return BigDecimal.valueOf(amountTiyin).movePointLeft(2).setScale(2, RoundingMode.HALF_UP);
    }

    public static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank() || "null".equals(raw)) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (Exception e) {
            return null;
        }
    }

    public static BigDecimal toDecimal(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(raw));
        } catch (Exception e) {
            return null;
        }
    }

    public static Instant millisToInstant(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            long ms = Long.parseLong(String.valueOf(raw).trim());
            return Instant.ofEpochMilli(ms);
        } catch (Exception e) {
            return null;
        }
    }

    public static Integer parseReason(Object raw) {
        if (raw == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
