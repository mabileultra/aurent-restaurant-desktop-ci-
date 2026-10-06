package com.pos.platform.dto.billing;

import com.pos.platform.domain.BillingPaymentState;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BillingCalendarResponse(
    String month,
    BigDecimal totalAmount,
    long totalCount,
    List<Day> days
) {
    public record Day(LocalDate date, long count, BigDecimal amount, List<Item> items) {}

    public record Item(Integer companyId, String companyName, BigDecimal amount, BillingPaymentState paymentState) {}
}
