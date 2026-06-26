package com.pos.util;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

public final class BusinessTypeParser {

    private BusinessTypeParser() {}

    public static String parseRequired(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BadRequestException("Business type is required");
        }
        return BusinessTypeCodes.normalize(code);
    }

    public static String parseOrDefault(String code, String fallback) {
        if (!StringUtils.hasText(code)) {
            return fallback != null ? fallback : BusinessTypeCodes.UNIVERSAL;
        }
        return BusinessTypeCodes.normalize(code);
    }
}
