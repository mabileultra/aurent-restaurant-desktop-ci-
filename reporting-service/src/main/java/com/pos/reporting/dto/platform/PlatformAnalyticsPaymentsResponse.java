package com.pos.reporting.dto.platform;

import java.math.BigDecimal;
import java.util.List;

public record PlatformAnalyticsPaymentsResponse(
    String period,
    String periodFrom,
    String periodTo,
    boolean demo,
    BigDecimal totalAmount,
    long totalReceipts,
    List<PlatformPaymentMethodRow> methods,
    List<PlatformPaymentDailyRow> daily
) {
    public record PlatformPaymentMethodRow(
        String id,
        String label,
        BigDecimal amount,
        long receipts,
        BigDecimal sharePct
    ) {}

    public record PlatformPaymentDailyRow(
        String date,
        String label,
        BigDecimal cash,
        BigDecimal card,
        BigDecimal other
    ) {}
}
