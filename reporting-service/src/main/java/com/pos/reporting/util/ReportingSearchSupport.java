package com.pos.reporting.util;

import org.springframework.util.StringUtils;

public final class ReportingSearchSupport {

    private ReportingSearchSupport() {
    }

    public static String normalizeLikePattern(String search) {
        if (!StringUtils.hasText(search)) {
            return null;
        }
        return search.trim();
    }
}
