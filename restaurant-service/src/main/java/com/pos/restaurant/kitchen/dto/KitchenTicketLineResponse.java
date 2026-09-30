package com.pos.restaurant.kitchen.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record KitchenTicketLineResponse(
    UUID id,
    UUID orderItemId,
    String name,
    String portionText,
    BigDecimal quantity,
    String note,
    List<String> modifiers
) {}
