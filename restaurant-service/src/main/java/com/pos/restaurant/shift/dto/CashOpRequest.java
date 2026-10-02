package com.pos.restaurant.shift.dto;

import com.pos.restaurant.shift.domain.CashOpType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CashOpRequest(
    @NotNull CashOpType type,
    @NotNull @DecimalMin("0.01") BigDecimal amount,
    @Size(max = 500) String comment
) {
}
