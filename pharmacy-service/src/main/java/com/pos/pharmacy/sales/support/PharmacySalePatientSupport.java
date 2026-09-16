package com.pos.pharmacy.sales.support;

import org.springframework.stereotype.Component;

@Component
public class PharmacySalePatientSupport {

    public String normalizePinfl(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String digits = raw.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        return digits.length() > 14 ? digits.substring(0, 14) : digits;
    }

    public String normalizeLoyaltyPhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.length() > 32 ? trimmed.substring(0, 32) : trimmed;
    }
}
