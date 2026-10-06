package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public record BillingReportsResponse(
    Revenue revenue,
    Expected expected,
    Debt debt,
    String methodsPeriod,
    List<MethodShare> methods
) {
    public record Revenue(BigDecimal today, BigDecimal week, BigDecimal month, BigDecimal year) {}

    public record Expected(
        BigDecimal today,
        long todayCount,
        BigDecimal next7Days,
        long next7DaysCount,
        BigDecimal next30Days,
        long next30DaysCount
    ) {}

    public record Debt(BigDecimal total, long count, BigDecimal average) {}

    public record MethodShare(BillingPaymentMethod method, BigDecimal amount, long count, int percent) {}
}
