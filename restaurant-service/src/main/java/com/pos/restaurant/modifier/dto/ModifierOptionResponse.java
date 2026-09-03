package com.pos.restaurant.modifier.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ModifierOptionResponse(
    UUID id,
    String name,
    BigDecimal priceDelta,
    int sortOrder,
    boolean active
) {}
