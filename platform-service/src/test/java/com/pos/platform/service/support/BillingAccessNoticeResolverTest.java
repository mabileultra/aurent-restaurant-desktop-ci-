package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.entity.BillingPlan;
import com.pos.platform.entity.CompanyBilling;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class BillingAccessNoticeResolverTest {

    private BillingAccessNoticeResolver resolver;
    private Instant now;

    @BeforeEach
    void setUp() {
        resolver = new BillingAccessNoticeResolver();
        now = LocalDate.of(2026, 10, 27).atStartOfDay(BillingTime.ZONE).toInstant().plusSeconds(12 * 3600L);
    }

    @Test
    void grace_requiresNotice() {
        CompanyBilling b = billing(BillingAccountStatus.GRACE, true, "50000", "100000", now.minus(30, ChronoUnit.DAYS));
        b.setGraceUntil(now.plus(2, ChronoUnit.DAYS));

        var notice = resolver.resolve(b, now);

        assertThat(notice.required()).isTrue();
        assertThat(notice.kind()).isEqualTo("GRACE");
        assertThat(notice.graceDaysLeft()).isEqualTo(2);
    }

    @Test
    void dueToday_withLowBalance_requiresNotice() {
        Instant due = LocalDate.of(2026, 10, 27).atStartOfDay(BillingTime.ZONE).toInstant();
        CompanyBilling b = billing(BillingAccountStatus.ACTIVE, true, "10000", "100000", due);

        var notice = resolver.resolve(b, now);

        assertThat(notice.required()).isTrue();
        assertThat(notice.kind()).isEqualTo("DUE_TODAY");
    }

    @Test
    void futureDue_noNotice() {
        Instant due = LocalDate.of(2026, 11, 1).atStartOfDay(BillingTime.ZONE).toInstant();
        CompanyBilling b = billing(BillingAccountStatus.ACTIVE, true, "0", "100000", due);

        assertThat(resolver.resolve(b, now).required()).isFalse();
    }

    @Test
    void enoughBalance_noNotice() {
        Instant due = LocalDate.of(2026, 10, 27).atStartOfDay(BillingTime.ZONE).toInstant();
        CompanyBilling b = billing(BillingAccountStatus.ACTIVE, true, "200000", "100000", due);

        assertThat(resolver.resolve(b, now).required()).isFalse();
    }

    @Test
    void overdue_withLowBalance_requiresNotice() {
        Instant due = LocalDate.of(2026, 10, 20).atStartOfDay(BillingTime.ZONE).toInstant();
        CompanyBilling b = billing(BillingAccountStatus.ACTIVE, true, "10000", "100000", due);

        var notice = resolver.resolve(b, now);

        assertThat(notice.required()).isTrue();
        assertThat(notice.kind()).isEqualTo("OVERDUE");
    }

    @Test
    void blocked_noSoftNotice() {
        CompanyBilling b = billing(BillingAccountStatus.BLOCKED, true, "0", "100000", now);
        assertThat(resolver.resolve(b, now).required()).isFalse();
    }

    @Test
    void billingDisabled_noNotice() {
        Instant due = LocalDate.of(2026, 10, 27).atStartOfDay(BillingTime.ZONE).toInstant();
        CompanyBilling b = billing(BillingAccountStatus.ACTIVE, false, "0", "100000", due);
        assertThat(resolver.resolve(b, now).required()).isFalse();
    }

    private static CompanyBilling billing(
        BillingAccountStatus status,
        boolean enabled,
        String balance,
        String planPrice,
        Instant nextChargeAt
    ) {
        BillingPlan plan = new BillingPlan();
        plan.setMonthlyPrice(new BigDecimal(planPrice));
        CompanyBilling b = new CompanyBilling();
        b.setBillingEnabled(enabled);
        b.setStatus(status);
        b.setBalance(new BigDecimal(balance));
        b.setAddonMonthlyAmount(BigDecimal.ZERO);
        b.setPlan(plan);
        b.setNextChargeAt(nextChargeAt);
        return b;
    }
}
