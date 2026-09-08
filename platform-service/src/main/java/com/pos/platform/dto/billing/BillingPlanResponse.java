package com.pos.platform.dto.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BillingPlanResponse(
    UUID id,
    String code,
    String name,
    String description,
    BigDecimal monthlyPrice,
    String currency,
    Integer maxRegisters,
    Integer maxStores,
    boolean active,
    int sortOrder
) {}
