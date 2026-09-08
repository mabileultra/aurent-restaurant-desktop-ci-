package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record BillingPaymentCreateResponse(
    UUID intentId,
    BillingPaymentProvider provider,
    BigDecimal amount,
    BillingPaymentStatus status,
    String paymentUrl
) {}
