package com.pos.service.identity.support;

import org.springframework.util.StringUtils;

import java.util.List;

public final class CompanyTypeCodes {

    private CompanyTypeCodes() {
    }

    public static List<String> expand(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        String code = raw.trim().toUpperCase();
        if ("RETAIL".equals(code) || "UNIVERSAL".equals(code)) {
            return List.of("UNIVERSAL", "RETAIL");
        }
        return List.of(code);
    }
}
