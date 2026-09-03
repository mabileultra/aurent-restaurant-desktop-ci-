package com.pos.restaurant.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemModifierResponse(
    UUID id,
    String name,
    BigDecimal priceDelta
) {}
