package com.pos.platform.util;

import org.springframework.util.StringUtils;

public final class TextUtil {

    private TextUtil() {}

    public static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
