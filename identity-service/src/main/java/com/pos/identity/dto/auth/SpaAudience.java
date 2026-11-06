package com.pos.identity.dto.auth;

import com.pos.identity.exception.BadRequestException;

/**
 * Target SPA for cross-origin session handoff (one-time code, not JWT in URL).
 */
public enum SpaAudience {
    MAIN,
    RESTAURANT,
    PHARMACY;

    public static SpaAudience fromRequest(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("audience is required");
        }
        try {
            return SpaAudience.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unknown audience: " + raw);
        }
    }
}
