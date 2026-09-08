package com.pos.platform.dto.billing;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssignCompanyPlanRequest(
    UUID planId,
    @DecimalMin("0.00") BigDecimal addonMonthlyAmount,
    Boolean autoChargeEnabled,
    Boolean billingEnabled,
    LocalDate periodStartOn
) {}
