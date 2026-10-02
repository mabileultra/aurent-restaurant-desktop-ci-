package com.pos.restaurant.shift.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OpenShiftRequest(
    @NotNull @DecimalMin("0.0") BigDecimal openingCash,
    String comment,
    Boolean confirmOpening
) {
}
