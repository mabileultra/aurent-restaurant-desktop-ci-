package com.pos.dto.identity.internal;

public record SuperAdminLoginEmailRequest(
    String userId,
    String username,
    String email,
    String fullName,
    String clientIp,
    String userAgent
) {}
