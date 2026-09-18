package com.pos.sales.service.zreport.support;

import com.pos.sales.entity.ZReport;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

/**
 * Пустой Z сразу после сброса периода («Печать Z» → «Закрыть смену» за секунды)
 * не является отдельной сменой.
 */
public final class ZReportLeftoverDocument {

    static final Duration MAX_EMPTY_CLOSE_SPAN = Duration.ofMinutes(5);

    private ZReportLeftoverDocument() {
    }

    public static boolean hideFromList(ZReport report) {
        if (report == null) {
            return false;
        }
        return hideFromList(
            report.getOpenedAt(),
            report.getClosedAt(),
            report.getSalesCount(),
            report.getTotalAmount(),
            report.getReturnsCount(),
            report.getReturnsCash(),
            report.getReturnsCard(),
            report.getReturnsHumo(),
            report.getReturnsUzcard(),
            report.getReturnsCashless(),
            report.getVatReturn()
        );
    }

    public static boolean hideFromList(
        Instant openedAt,
        Instant closedAt,
        Integer salesCount,
        BigDecimal totalAmount,
        Integer returnsCount,
        BigDecimal returnsCash,
        BigDecimal returnsCard,
        BigDecimal returnsHumo,
        BigDecimal returnsUzcard,
        BigDecimal returnsCashless,
        BigDecimal vatReturn
    ) {
        return isEmpty(
            salesCount,
            totalAmount,
            returnsCount,
            returnsCash,
            returnsCard,
            returnsHumo,
            returnsUzcard,
            returnsCashless,
            vatReturn
        ) && shortLivedClose(openedAt, closedAt);
    }

    static boolean isEmpty(
        Integer salesCount,
        BigDecimal totalAmount,
        Integer returnsCount,
        BigDecimal returnsCash,
        BigDecimal returnsCard,
        BigDecimal returnsHumo,
        BigDecimal returnsUzcard,
        BigDecimal returnsCashless,
        BigDecimal vatReturn
    ) {
        int sales = salesCount != null ? salesCount : 0;
        int returns = returnsCount != null ? returnsCount : 0;
        return sales == 0
            && returns == 0
            && isZero(totalAmount)
            && isZero(returnsCash)
            && isZero(returnsCard)
            && isZero(returnsHumo)
            && isZero(returnsUzcard)
            && isZero(returnsCashless)
            && isZero(vatReturn);
    }

    static boolean shortLivedClose(Instant openedAt, Instant closedAt) {
        if (openedAt == null || closedAt == null || closedAt.isBefore(openedAt)) {
            return false;
        }
        return Duration.between(openedAt, closedAt).compareTo(MAX_EMPTY_CLOSE_SPAN) <= 0;
    }

    private static boolean isZero(BigDecimal value) {
        return value == null || value.signum() == 0;
    }
}
