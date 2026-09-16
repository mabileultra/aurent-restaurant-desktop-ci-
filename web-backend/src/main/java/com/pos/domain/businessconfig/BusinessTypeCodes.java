package com.pos.domain.businessconfig;

import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

/**
 * Нормализация кода типа бизнеса (строка вместо enum).
 */
public final class BusinessTypeCodes {

    public static final String UNIVERSAL = "UNIVERSAL";
    public static final String RESTAURANT = "RESTAURANT";
    public static final String PHARMACY = "PHARMACY";

    private BusinessTypeCodes() {}

    public static String normalize(String code) {
        if (!StringUtils.hasText(code)) {
            return UNIVERSAL;
        }
        String normalized = code.trim().toUpperCase();
        if ("RETAIL".equals(normalized)) {
            return UNIVERSAL;
        }
        return normalized;
    }

    public static String parseRequired(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BadRequestException("Business type is required");
        }
        return normalize(code);
    }
}
