package com.pos.dto.identity.internal;

public record IdentityAuditRequest(
    String userId,
    String action,
    String entityType,
    String entityId,
    String oldValue,
    String newValue
) {}
