package com.pos.identity.dto.security;

public record TwoFactorSetupResponse(
    String secret,
    String otpauthUrl,
    boolean enabled
) {
}
