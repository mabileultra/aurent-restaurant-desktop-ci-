package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.domain.BillingPaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BillingLedgerResponse(
    UUID id,
    Integer companyId,
    BillingLedgerType entryType,
    BigDecimal amount,
    BigDecimal balanceAfter,
    String description,
    String actorRole,
    Instant createdAt,
    BillingPaymentMethod paymentMethod
) {}
