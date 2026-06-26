package com.pos.platform.domain;

import com.pos.platform.exception.BadRequestException;
import org.springframework.util.StringUtils;

public final class BusinessTypeCodes {

    public static final String UNIVERSAL = "UNIVERSAL";

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
