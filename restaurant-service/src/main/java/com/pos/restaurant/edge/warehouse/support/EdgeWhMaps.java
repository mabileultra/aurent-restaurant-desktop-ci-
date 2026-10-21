package com.pos.restaurant.edge.warehouse.support;

import com.pos.restaurant.exception.BusinessException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Request body parsing for edge warehouse endpoints. */
public final class EdgeWhMaps {

    private EdgeWhMaps() {}

    public static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    public static Integer intOr(Object v, Integer fallback) {
        if (v == null) return fallback;
        if (v instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    public static BigDecimal dec(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal b) return b;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(String.valueOf(v).trim().replace(',', '.'));
        } catch (Exception e) {
            return null;
        }
    }

    public static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    public static UUID uuid(Object v) {
        if (v == null) return null;
        if (v instanceof UUID u) return u;
        try {
            return UUID.fromString(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }

    public static BigDecimal requirePositive(BigDecimal v, String field) {
        if (v == null || v.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(field + " must be > 0");
        }
        return v;
    }

    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> lines(Map<String, Object> body) {
        Object raw = body.get("lines");
        if (!(raw instanceof List<?> list) || list.isEmpty()) {
            throw new BusinessException("lines required");
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof Map<?, ?> map) {
                out.add((Map<String, Object>) map);
            }
        }
        if (out.isEmpty()) throw new BusinessException("lines required");
        return out;
    }
}
