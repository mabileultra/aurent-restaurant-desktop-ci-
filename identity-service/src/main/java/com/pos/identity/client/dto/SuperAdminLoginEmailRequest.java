package com.pos.identity.client.dto;

public record SuperAdminLoginEmailRequest(
    String userId,
    String username,
    String email,
    String fullName,
    String clientIp,
    String userAgent
) {}
