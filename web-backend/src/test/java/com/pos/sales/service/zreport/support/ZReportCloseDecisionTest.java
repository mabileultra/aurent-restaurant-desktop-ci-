package com.pos.sales.service.zreport.support;

import com.pos.sales.dto.cashier.ShiftReportResponse;
import com.pos.sales.entity.CashierShift;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ZReportCloseDecisionTest {

    private static final Instant OPENED = Instant.parse("2026-09-11T10:27:57Z");

    @Test
    void skipsEmptyCloseWhenMiddayZAlreadyResetThePeriod() {
        CashierShift shift = shift(OPENED, OPENED.plusSeconds(10));
        assertThat(ZReportCloseDecision.skipEmptyCloseAfterPeriodZ(shift, emptyReport())).isTrue();
    }

    @Test
    void keepsCloseZWhenCashierNeverPrintedZ() {
        CashierShift shift = shift(OPENED, OPENED);
        assertThat(ZReportCloseDecision.skipEmptyCloseAfterPeriodZ(shift, emptyReport())).isFalse();
    }

    @Test
    void keepsCloseZWhenSalesHappenedAfterMiddayZ() {
        CashierShift shift = shift(OPENED, OPENED.plusSeconds(10));
        assertThat(ZReportCloseDecision.skipEmptyCloseAfterPeriodZ(shift, reportWithSales())).isFalse();
    }

    @Test
    void keepsCloseZWhenReturnHappenedAfterMiddayZ() {
        CashierShift shift = shift(OPENED, OPENED.plusSeconds(10));
        assertThat(ZReportCloseDecision.skipEmptyCloseAfterPeriodZ(shift, reportWithReturn())).isFalse();
    }

    @Test
    void periodFromPrefersResetBoundary() {
        Instant reset = OPENED.plusSeconds(12);
        CashierShift shift = shift(OPENED, reset);
        assertThat(ZReportCloseDecision.periodFrom(shift)).isEqualTo(reset);
    }

    private static CashierShift shift(Instant opened, Instant period) {
        CashierShift shift = new CashierShift();
        shift.setOpenedAt(opened);
        shift.setPeriodStartedAt(period);
        return shift;
    }

    private static ShiftReportResponse emptyReport() {
        return report(0, BigDecimal.ZERO, 0, BigDecimal.ZERO);
    }

    private static ShiftReportResponse reportWithSales() {
        return report(3, new BigDecimal("280000.00"), 0, BigDecimal.ZERO);
    }

    private static ShiftReportResponse reportWithReturn() {
        return report(0, BigDecimal.ZERO, 1, new BigDecimal("10000.00"));
    }

    private static ShiftReportResponse report(
        int saleCount,
        BigDecimal total,
        int returnsCount,
        BigDecimal returnsCash
    ) {
        return new ShiftReportResponse(
            "Z",
            UUID.randomUUID(),
            1,
            "Aminjon Samarqand XK",
            "kassa",
            OPENED,
            OPENED.plusSeconds(20),
            saleCount,
            total,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            returnsCount,
            returnsCash,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
    }
}
