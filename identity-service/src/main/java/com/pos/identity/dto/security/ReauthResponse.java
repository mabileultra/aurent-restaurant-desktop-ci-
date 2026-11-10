package com.pos.identity.dto.security;

public record ReauthResponse(
    String sudoToken,
    long expiresInSeconds
) {
}
