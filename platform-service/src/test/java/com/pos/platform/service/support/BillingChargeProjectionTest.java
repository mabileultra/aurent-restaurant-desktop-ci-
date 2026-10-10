package com.pos.platform.service.support;

import com.pos.platform.domain.BillingAccountStatus;
import com.pos.platform.domain.BillingPaymentState;
import com.pos.platform.dto.billing.CompanyBillingResponse;
import com.pos.platform.dto.billing.CompanyPaymentRowResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BillingChargeProjectionTest {

    private final BillingChargeProjection projection = new BillingChargeProjection();

    @Test
    void repeatsEveryPeriodInsideWindow() {
        LocalDate due = LocalDate.of(2026, 9, 20);
        var charges = projection.project(
            List.of(row(due, BillingPaymentState.ACTIVE)),
            LocalDate.of(2026, 10, 1),
            LocalDate.of(2026, 12, 31)
        );
        assertThat(charges).extracting(BillingChargeProjection.ProjectedCharge::date)
            .containsExactly(LocalDate.of(2026, 10, 20), LocalDate.of(2026, 11, 19), LocalDate.of(2026, 12, 19));
    }

    @Test
    void skipsSuspended() {
        var charges = projection.project(
            List.of(row(LocalDate.of(2026, 10, 5), BillingPaymentState.SUSPENDED)),
            LocalDate.of(2026, 10, 1),
            LocalDate.of(2026, 10, 31)
        );
        assertThat(charges).isEmpty();
    }

    private static CompanyPaymentRowResponse row(LocalDate due, BillingPaymentState state) {
        CompanyBillingResponse billing = new CompanyBillingResponse(
            1, "Co", null, null, null, null, BigDecimal.ZERO,
            new BigDecimal("500000"), BigDecimal.ZERO, BillingAccountStatus.ACTIVE,
            true, true, null, BillingTime.startOfDay(due), null, null, null, null, "UZS", null, null
        );
        return new CompanyPaymentRowResponse(billing, state, 0L, 0L, false, null, null, null, null, null, null, null);
    }
}
