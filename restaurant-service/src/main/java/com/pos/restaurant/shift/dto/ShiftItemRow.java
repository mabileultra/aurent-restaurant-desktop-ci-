package com.pos.restaurant.shift.dto;

import java.math.BigDecimal;

public record ShiftItemRow(
    String categoryName,
    String name,
    BigDecimal quantity,
    BigDecimal amount
) {}
