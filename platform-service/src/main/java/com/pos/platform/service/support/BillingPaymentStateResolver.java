package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Единственный источник правил «должник / скоро срок / активен» для супер-админа.
 * Скоро срок — до списания ≤ dueSoonDays и баланса не хватает на месяц (кто покрыт предоплатой, не тревожим).
 */
@Component
public class BillingPaymentStateResolver {

    private final int dueSoonDays;
    private final int newCompanyDays;

    public BillingPaymentStateResolver(
        @Value("${app.billing.due-soon-days:7}") int dueSoonDays,
        @Value("${app.billing.new-company-days:7}") int newCompanyDays
    ) {
        this.dueSoonDays = Math.max(dueSoonDays, 0);
        this.newCompanyDays = Math.max(newCompanyDays, 0);
    }

    public int dueSoonDays() {
        return dueSoonDays;
    }

    public int newCompanyDays() {
        return newCompanyDays;
    }

    public Resolution resolve(CompanyBillingResponse billing, Instant now) {
        Long daysUntilDue = daysUntil(billing.nextChargeAt(), now);
        if (!billing.billingEnabled()) {
            return new Resolution(BillingPaymentState.NOT_BILLED, daysUntilDue, null);
        }
        if (billing.status() == BillingAccountStatus.BLOCKED) {
            return new Resolution(BillingPaymentState.SUSPENDED, daysUntilDue, overdueDays(daysUntilDue));
        }
        BigDecimal balance = orZero(billing.balance());
        boolean uncovered = balance.compareTo(orZero(billing.monthlyTotal())) < 0;
        boolean pastDue = daysUntilDue != null && daysUntilDue < 0;
        if (billing.status() == BillingAccountStatus.GRACE
            || balance.signum() < 0
            || (pastDue && uncovered)) {
            return new Resolution(BillingPaymentState.OVERDUE, daysUntilDue, overdueDays(daysUntilDue));
        }
        if (daysUntilDue != null && daysUntilDue >= 0 && daysUntilDue <= dueSoonDays && uncovered) {
            return new Resolution(BillingPaymentState.DUE_SOON, daysUntilDue, null);
        }
        return new Resolution(BillingPaymentState.ACTIVE, daysUntilDue, null);
    }

    public boolean isNewCompany(Instant createdAt, Instant now) {
        return createdAt != null && !createdAt.isBefore(now.minus(newCompanyDays, ChronoUnit.DAYS));
    }

    private static Long daysUntil(Instant due, Instant now) {
        if (due == null) {
            return null;
        }
        LocalDate today = LocalDate.ofInstant(now, BillingTime.ZONE);
        LocalDate dueDay = LocalDate.ofInstant(due, BillingTime.ZONE);
        return ChronoUnit.DAYS.between(today, dueDay);
    }

    private static Long overdueDays(Long daysUntilDue) {
        return daysUntilDue != null && daysUntilDue < 0 ? -daysUntilDue : 0L;
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    public record Resolution(BillingPaymentState state, Long daysUntilDue, Long daysOverdue) {}
}
