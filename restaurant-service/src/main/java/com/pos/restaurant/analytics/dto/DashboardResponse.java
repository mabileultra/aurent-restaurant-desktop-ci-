package com.pos.restaurant.analytics.dto;

import java.time.Instant;

/**
 * Restaurant admin dashboard: period finance + live ops + live panels.
 * Net sales = paid amounts in period (refunds not re-added as positive).
 */
public record DashboardResponse(
    String periodKey,
    Instant from,
    Instant to,
    DashboardFinanceBlock finance,
    DashboardOpsBlock ops,
    DashboardLiveBlock live
) {
}
