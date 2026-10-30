package com.pos.platform.support;

import com.pos.platform.exception.BadRequestException;

/** Keeps only a usable contact phone for public site leads. */
public final class SiteLeadPhoneNormalizer {

    private static final int MIN_DIGITS = 9;

    private SiteLeadPhoneNormalizer() {}

    public static String normalize(String phone) {
        String trimmed = phone != null ? phone.trim() : "";
        if (trimmed.isEmpty()) {
            throw new BadRequestException("Phone is required");
        }
        int digits = 0;
        for (int i = 0; i < trimmed.length(); i++) {
            if (Character.isDigit(trimmed.charAt(i))) {
                digits++;
            }
        }
        if (digits < MIN_DIGITS) {
            throw new BadRequestException("Phone must contain at least " + MIN_DIGITS + " digits");
        }
        return trimmed;
    }
}
