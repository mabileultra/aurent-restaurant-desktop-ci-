package com.pos.catalog.service.product.support;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Варианты скана для grocery by-barcode: EAN-13 ↔ GTIN-14 ↔ 12 без check digit.
 */
public final class ProductBarcodeScanVariants {

    private ProductBarcodeScanVariants() {
    }

    public static List<String> of(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        String trimmed = raw.trim();
        String digits = digitsOnly(trimmed);
        LinkedHashSet<String> out = new LinkedHashSet<>();
        out.add(trimmed);
        if (StringUtils.hasText(digits) && !digits.equals(trimmed)) {
            out.add(digits);
        }
        if (digits.length() == 13) {
            out.add(digits.substring(0, 12));
            out.add("0" + digits);
        }
        if (digits.length() == 14 && digits.startsWith("0")) {
            out.add(digits.substring(1));
            if (digits.startsWith("00")) {
                out.add(digits.substring(2));
            }
        }
        if (digits.length() == 12) {
            out.add("0" + digits);
        }
        return new ArrayList<>(out);
    }

    private static String digitsOnly(String value) {
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (ch >= '0' && ch <= '9') {
                sb.append(ch);
            }
        }
        return sb.toString();
    }
}
