package com.pos.restaurant.kitchen.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record KitchenTicketLineResponse(
    UUID orderItemId,
    String name,
    BigDecimal quantity,
    String note
) {}
