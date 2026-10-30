package com.pos.sales.dto.cashier;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ShiftCashMovementRequest(
    @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
    @Size(max = 500) String note
) {
}
