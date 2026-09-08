package com.pos.platform.dto.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdjustBalanceRequest(
    @NotNull BigDecimal amount,
    @Size(max = 500) String description
) {}
