package com.pos.identity.util;

import org.springframework.util.StringUtils;

public final class TextUtil {

    private TextUtil() {
    }

    public static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
