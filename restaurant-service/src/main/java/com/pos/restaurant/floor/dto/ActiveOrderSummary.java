package com.pos.restaurant.floor.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ActiveOrderSummary(
    UUID id,
    int orderNo,
    int guestCount,
    int adultCount,
    int childrenCount,
    BigDecimal subtotal,
    int linesCount
) {}
