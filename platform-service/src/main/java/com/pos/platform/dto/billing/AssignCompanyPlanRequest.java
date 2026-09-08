package com.pos.platform.dto.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record AssignCompanyPlanRequest(
    @NotNull UUID planId,
    @DecimalMin("0.00") BigDecimal addonMonthlyAmount,
    Boolean autoChargeEnabled,
    Boolean billingEnabled
) {}
