package com.pos.restaurant.analytics.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Shared payment aggregates for dashboard finance and sales report.
 */
@Component
@RequiredArgsConstructor
public class AnalyticsPaymentTotalsSupport {

    public record Totals(
        BigDecimal revenue,
        BigDecimal cashAmount,
        BigDecimal cardAmount,
        long paymentCount
    ) {
    }

    private final AnalyticsPaymentQuerySupport payments;

    public Totals load(Integer companyId, Integer storeId, Instant from, Instant to) {
        BigDecimal revenue = payments.sumPayments(companyId, storeId, from, to);
        BigDecimal cash = payments.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASH, from, to);
        BigDecimal card = payments.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CARD, from, to)
            .add(payments.sumPaymentsByMethod(companyId, storeId, PaymentMethod.CASHLESS, from, to));
        long paymentCount = payments.countPayments(companyId, storeId, from, to);
        return new Totals(revenue, cash, card, paymentCount);
    }
}
