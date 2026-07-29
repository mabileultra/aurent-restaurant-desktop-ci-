package com.pos.dto.crm.internal;

import java.time.Instant;
import java.util.UUID;

public record CustomerSyncRequest(
    String operation,
    UUID id,
    Integer companyId,
    String name,
    String phone,
    String email,
    int loyaltyPts,
    Instant createdAt
) {}
