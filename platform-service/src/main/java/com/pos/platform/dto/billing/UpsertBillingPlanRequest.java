package com.pos.platform.dto.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpsertBillingPlanRequest(
    @NotBlank @Size(max = 64) String code,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 500) String description,
    @NotNull @DecimalMin("0.00") BigDecimal monthlyPrice,
    @Size(max = 8) String currency,
    Integer maxRegisters,
    Integer maxStores,
    Boolean active,
    Integer sortOrder
) {}
