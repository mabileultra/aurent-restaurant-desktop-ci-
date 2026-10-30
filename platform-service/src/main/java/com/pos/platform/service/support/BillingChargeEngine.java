package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingLedgerType;
import com.pos.platform.entity.CompanyBilling;
import com.pos.platform.service.BillingLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Списания по периоду, grace/block и сдвиг nextChargeAt.
 */
@Component
@RequiredArgsConstructor
public class BillingChargeEngine {

    private final BillingLedgerService ledgerService;

    @Value("${app.billing.grace-days:3}")
    private int graceDays;

    public void refreshAccessStatus(CompanyBilling billing, Instant now) {
        if (!billing.isBillingEnabled()) {
            billing.setStatus(BillingAccountStatus.ACTIVE);
            return;
        }
        if (billing.getStatus() == BillingAccountStatus.BLOCKED
            || billing.getStatus() == BillingAccountStatus.GRACE) {
            BigDecimal total = BillingMapper.monthlyTotal(billing);
            if (billing.getBalance().compareTo(total) >= 0) {
                billing.setStatus(BillingAccountStatus.ACTIVE);
                billing.setGraceUntil(null);
                applyDueCharges(billing, now);
            }
        }
    }

    public int applyDueCharges(CompanyBilling billing, Instant now) {
        if (!billing.isBillingEnabled() || !billing.isAutoChargeEnabled()) {
            return 0;
        }
        if (billing.getStatus() == BillingAccountStatus.BLOCKED) {
            return 0;
        }
        int charged = 0;
        for (int i = 0; i < BillingTime.MAX_CATCH_UP_PERIODS; i++) {
            Instant due = billing.getNextChargeAt();
            if (due == null || due.isAfter(now)) {
                break;
            }
            BigDecimal total = BillingMapper.monthlyTotal(billing);
            if (total.signum() <= 0) {
                advanceFromDue(billing, due);
                billing.setStatus(BillingAccountStatus.ACTIVE);
                billing.setGraceUntil(null);
                break;
            }
            if (billing.getBalance().compareTo(total) >= 0) {
                String planName = billing.getPlan() != null ? billing.getPlan().getName() : "тариф";
                ledgerService.record(
                    billing,
                    total.negate(),
                    BillingLedgerType.CHARGE,
                    "Ежемесячное списание: " + planName
                );
                advanceFromDue(billing, due);
                billing.setStatus(BillingAccountStatus.ACTIVE);
                billing.setGraceUntil(null);
                charged++;
                continue;
            }
            enterGraceOrBlock(billing, now);
            break;
        }
        return charged;
    }

    public void advancePeriod(CompanyBilling billing, Instant from) {
        Instant base = billing.getNextChargeAt() != null && !billing.getNextChargeAt().isAfter(from)
            ? billing.getNextChargeAt()
            : from;
        advanceFromDue(billing, base);
    }

    public void applyChargeStart(CompanyBilling billing, LocalDate periodStartOn) {
        Instant now = Instant.now();
        if (periodStartOn == null) {
            if (billing.getNextChargeAt() == null) {
                billing.setNextChargeAt(now);
                billing.setPaidUntil(now.plus(BillingTime.PERIOD_DAYS, ChronoUnit.DAYS));
            }
            return;
        }
        boolean periodChanged = !Objects.equals(periodStartOn, billing.getPeriodStartOn())
            || billing.getNextChargeAt() == null;
        billing.setPeriodStartOn(periodStartOn);
        if (!periodChanged) {
            return;
        }
        Instant start = BillingTime.startOfDay(periodStartOn);
        billing.setNextChargeAt(start);
        if (start.isAfter(now)) {
            billing.setPaidUntil(start);
        } else {
            billing.setPaidUntil(start.plus(BillingTime.PERIOD_DAYS, ChronoUnit.DAYS));
        }
    }

    private void advanceFromDue(CompanyBilling billing, Instant due) {
        Instant next = due.plus(BillingTime.PERIOD_DAYS, ChronoUnit.DAYS);
        billing.setNextChargeAt(next);
        billing.setPaidUntil(next);
    }

    private void enterGraceOrBlock(CompanyBilling billing, Instant now) {
        if (billing.getStatus() != BillingAccountStatus.GRACE
            && billing.getStatus() != BillingAccountStatus.BLOCKED) {
            billing.setStatus(BillingAccountStatus.GRACE);
            billing.setGraceUntil(later(now.plus(Math.max(graceDays, 0), ChronoUnit.DAYS), billing.getDeferredUntil()));
            return;
        }
        Instant blockAfter = later(billing.getGraceUntil(), billing.getDeferredUntil());
        if (blockAfter != null && now.isAfter(blockAfter)) {
            billing.setStatus(BillingAccountStatus.BLOCKED);
        }
    }

    private static Instant later(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }
}
