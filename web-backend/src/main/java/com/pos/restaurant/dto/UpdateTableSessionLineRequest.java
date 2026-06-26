package com.pos.restaurant.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateTableSessionLineRequest(
    @NotNull @DecimalMin("0.001") BigDecimal quantity,
    String note
) {}
