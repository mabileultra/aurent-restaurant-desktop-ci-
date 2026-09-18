package com.pos.sales.service.zreport.support;

import com.pos.sales.dto.cashier.ShiftReportResponse;
import com.pos.sales.entity.CashierShift;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * После «Печать Z-отчёта» период сбрасывается, смена остаётся открытой.
 * «Закрыть смену» через ~10 сек писало второй Z с нулями — это не отдельная смена.
 */
public final class ZReportCloseDecision {

    private ZReportCloseDecision() {
    }

    public static boolean skipEmptyCloseAfterPeriodZ(CashierShift shift, ShiftReportResponse report) {
        if (shift == null || report == null) {
            return false;
        }
        return periodAlreadyFinalized(shift) && isEmptyPeriod(report);
    }

    public static Instant periodFrom(CashierShift shift) {
        if (shift == null) {
            return null;
        }
        if (shift.getPeriodStartedAt() != null) {
            return shift.getPeriodStartedAt();
        }
        return shift.getOpenedAt();
    }

    static boolean periodAlreadyFinalized(CashierShift shift) {
        Instant opened = shift.getOpenedAt();
        Instant period = shift.getPeriodStartedAt();
        return opened != null && period != null && period.isAfter(opened);
    }

    static boolean isEmptyPeriod(ShiftReportResponse report) {
        return report.saleCount() == 0
            && isZero(report.totalAmount())
            && report.returnsCount() == 0
            && isZero(report.returnsCash())
            && isZero(report.returnsCard())
            && isZero(report.returnsHumo())
            && isZero(report.returnsUzcard())
            && isZero(report.returnsCashless())
            && isZero(report.returnsVat());
    }

    private static boolean isZero(BigDecimal value) {
        return value == null || value.signum() == 0;
    }
}
