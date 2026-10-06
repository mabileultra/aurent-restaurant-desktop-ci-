package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

class BillingPaymentStateResolverTest {

    private static final Instant NOW = Instant.parse("2026-10-06T07:00:00Z");
    private final BillingPaymentStateResolver resolver = new BillingPaymentStateResolver(7, 7);

    @Test
    void overdueWhenDuePassedAndBalanceDoesNotCover() {
        var r = resolver.resolve(billing(BillingAccountStatus.ACTIVE, "0", NOW.minus(20, ChronoUnit.DAYS)), NOW);
        assertThat(r.state()).isEqualTo(BillingPaymentState.OVERDUE);
        assertThat(r.daysOverdue()).isEqualTo(20L);
    }

    @Test
    void dueSoonOnlyWhenPrepaidBalanceIsShort() {
        Instant due = NOW.plus(3, ChronoUnit.DAYS);
        assertThat(resolver.resolve(billing(BillingAccountStatus.ACTIVE, "0", due), NOW).state())
            .isEqualTo(BillingPaymentState.DUE_SOON);
        assertThat(resolver.resolve(billing(BillingAccountStatus.ACTIVE, "1000000", due), NOW).state())
            .isEqualTo(BillingPaymentState.ACTIVE);
    }

    @Test
    void negativeBalanceOrGraceIsOverdue() {
        Instant due = NOW.plus(10, ChronoUnit.DAYS);
        assertThat(resolver.resolve(billing(BillingAccountStatus.ACTIVE, "-5", due), NOW).state())
            .isEqualTo(BillingPaymentState.OVERDUE);
        assertThat(resolver.resolve(billing(BillingAccountStatus.GRACE, "0", due), NOW).state())
            .isEqualTo(BillingPaymentState.OVERDUE);
    }

    @Test
    void blockedIsSuspended() {
        assertThat(resolver.resolve(billing(BillingAccountStatus.BLOCKED, "-1", NOW), NOW).state())
            .isEqualTo(BillingPaymentState.SUSPENDED);
    }

    private static CompanyBillingResponse billing(BillingAccountStatus status, String balance, Instant next) {
        return new CompanyBillingResponse(
            1, "Co", null, null, null, null, BigDecimal.ZERO,
            new BigDecimal("1000000"), new BigDecimal(balance), status,
            true, true, null, next, null, null, null, null, "UZS", null, null
        );
    }
}
