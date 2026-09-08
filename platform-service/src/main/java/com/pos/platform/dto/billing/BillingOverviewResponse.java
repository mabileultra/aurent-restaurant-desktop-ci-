package com.pos.platform.dto.billing;

import java.math.BigDecimal;

public record BillingOverviewResponse(
    BigDecimal mrr,
    long activeCount,
    long graceCount,
    long blockedCount,
    long pendingTopUps
) {}
