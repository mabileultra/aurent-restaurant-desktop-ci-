package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingAccountStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CompanyBillingResponse(
    Integer companyId,
    String companyName,
    UUID planId,
    String planCode,
    String planName,
    BigDecimal planMonthlyPrice,
    BigDecimal addonMonthlyAmount,
    BigDecimal monthlyTotal,
    BigDecimal balance,
    BillingAccountStatus status,
    boolean billingEnabled,
    boolean autoChargeEnabled,
    LocalDate periodStartOn,
    Instant nextChargeAt,
    Instant paidUntil,
    Instant graceUntil,
    Integer maxRegisters,
    Integer maxStores,
    String currency
) {}
