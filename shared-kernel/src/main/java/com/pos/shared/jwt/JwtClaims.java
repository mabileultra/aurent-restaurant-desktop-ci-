package com.pos.shared.jwt;

import java.util.UUID;

/**
 * Распарсенные claims JWT для tenant-контекста.
 */
public record JwtClaims(
    UUID userId,
    Integer companyId,
    String role
) {
}
