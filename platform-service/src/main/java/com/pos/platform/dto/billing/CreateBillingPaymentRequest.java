package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentProvider;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateBillingPaymentRequest(
    @NotNull BillingPaymentProvider provider,
    @NotNull @DecimalMin("1000.00") BigDecimal amount
) {}
