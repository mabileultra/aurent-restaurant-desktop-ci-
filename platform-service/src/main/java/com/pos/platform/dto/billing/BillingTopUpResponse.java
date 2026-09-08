package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingTopUpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BillingTopUpResponse(
    UUID id,
    Integer companyId,
    String companyName,
    BigDecimal amount,
    BillingTopUpStatus status,
    String comment,
    String receiptFileName,
    boolean hasReceipt,
    UUID submittedByUserId,
    UUID reviewedByUserId,
    String reviewNote,
    Instant reviewedAt,
    Instant createdAt
) {}
