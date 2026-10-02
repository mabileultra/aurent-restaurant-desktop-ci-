package com.pos.restaurant.shift.dto;

import java.math.BigDecimal;

public record ShiftItemRow(
    String name,
    BigDecimal quantity,
    BigDecimal amount
) {}
