package com.pos.identity.client.dto;

public record AuditRequest(
    String userId,
    String action,
    String entityType,
    String entityId,
    String oldValue,
    String newValue
) {}
