package com.pos.identity.dto.auth;

public record HandoffCodeResponse(
    String code,
    String audience,
    int expiresInSeconds
) {}
