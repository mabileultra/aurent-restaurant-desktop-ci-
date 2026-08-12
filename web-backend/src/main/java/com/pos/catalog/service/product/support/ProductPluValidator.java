package com.pos.catalog.service.product.support;

import com.pos.exception.PosExceptions;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Нормализация и валидация PLU (код на весах), 1–5 цифр.
 */
@Component
public class ProductPluValidator {

    public static final int MAX_PLU_LENGTH = 5;

    public String normalizeOrNull(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        String digits = raw.trim().replaceAll("\\D", "");
        if (!StringUtils.hasText(digits)) {
            return null;
        }
        if (digits.length() > MAX_PLU_LENGTH) {
            throw PosExceptions.badRequest("PLU must be 1–5 digits", "plu", raw);
        }
        // без ведущих нулей в хранении, кроме "0"
        String normalized = digits.replaceFirst("^0+(?!$)", "");
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        return normalized;
    }

    public String requireNormalized(String raw) {
        String normalized = normalizeOrNull(raw);
        if (normalized == null) {
            throw PosExceptions.badRequest("PLU is required", "plu", raw);
        }
        return normalized;
    }

    /** 5 цифр для EAN весового формата. */
    public String toBarcodePart(String plu) {
        String normalized = requireNormalized(plu);
        return String.format("%05d", Integer.parseInt(normalized));
    }
}
