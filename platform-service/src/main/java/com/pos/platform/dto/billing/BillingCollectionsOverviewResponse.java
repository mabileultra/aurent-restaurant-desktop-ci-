package com.pos.platform.dto.billing;

import java.math.BigDecimal;

public record BillingCollectionsOverviewResponse(
    long totalCompanies,
    long newCompanies,
    long activeCount,
    long dueSoonCount,
    long overdueCount,
    long suspendedCount,
    long notBilledCount,
    BigDecimal mrr,
    BigDecimal debtTotal,
    BigDecimal expectedSoonAmount,
    long pendingTopUps,
    int dueSoonDays,
    int newCompanyDays
) {}
