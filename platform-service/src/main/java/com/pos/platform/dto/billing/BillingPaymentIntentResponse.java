package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentProvider;
import com.pos.platform.domain.BillingPaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BillingPaymentIntentResponse(
    UUID id,
    Integer companyId,
    String companyName,
    BillingPaymentProvider provider,
    BigDecimal amount,
    String currency,
    BillingPaymentStatus status,
    String providerTransId,
    String errorNote,
    Instant paidAt,
    Instant createdAt,
    String paymentUrl
) {}
