package com.pos.sales.dto.cashier;

import java.math.BigDecimal;

public record ShiftItemRow(
    String name,
    BigDecimal quantity,
    BigDecimal amount
) {}
