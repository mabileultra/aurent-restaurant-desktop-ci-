package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.entity.CompanyBilling;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Когда показывать мягкое напоминание об оплате в продукте (не BLOCKED).
 */
@Component
public class BillingAccessNoticeResolver {

    public record Notice(
        boolean required,
        String kind,
        Instant nextChargeAt,
        Instant graceUntil,
        Integer graceDaysLeft
    ) {
        public static Notice none() {
            return new Notice(false, null, null, null, null);
        }
    }

    public Notice resolve(CompanyBilling billing, Instant now) {
        if (billing == null || !billing.isBillingEnabled()) {
            return Notice.none();
        }
        if (billing.getStatus() == BillingAccountStatus.BLOCKED) {
            return Notice.none();
        }

        Instant nextChargeAt = billing.getNextChargeAt();
        Instant graceUntil = billing.getGraceUntil();
        Integer graceDaysLeft = null;
        if (graceUntil != null && graceUntil.isAfter(now)) {
            graceDaysLeft = (int) Math.max(0, ChronoUnit.DAYS.between(
                now.atZone(BillingTime.ZONE).toLocalDate(),
                graceUntil.atZone(BillingTime.ZONE).toLocalDate()
            ));
        }

        if (billing.getStatus() == BillingAccountStatus.GRACE) {
            return new Notice(true, "GRACE", nextChargeAt, graceUntil, graceDaysLeft);
        }

        if (nextChargeAt == null) {
            return Notice.none();
        }

        LocalDate due = nextChargeAt.atZone(BillingTime.ZONE).toLocalDate();
        LocalDate today = now.atZone(BillingTime.ZONE).toLocalDate();
        if (due.isAfter(today)) {
            return Notice.none();
        }

        BigDecimal total = BillingMapper.monthlyTotal(billing);
        if (total == null || total.signum() <= 0) {
            return Notice.none();
        }
        BigDecimal balance = billing.getBalance() != null ? billing.getBalance() : BigDecimal.ZERO;
        if (balance.compareTo(total) >= 0) {
            return Notice.none();
        }

        String kind = due.isBefore(today) ? "OVERDUE" : "DUE_TODAY";
        return new Notice(true, kind, nextChargeAt, graceUntil, graceDaysLeft);
    }
}
