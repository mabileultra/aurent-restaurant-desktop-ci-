package com.pos.restaurant.commission.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record WaiterCommissionOverrideResponse(
    UUID userId,
    BigDecimal percent
) {}
