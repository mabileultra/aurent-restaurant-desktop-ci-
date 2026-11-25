package com.pos.sales.service.zreport.support;

import java.math.BigDecimal;

/** Безнал на Z: QR/CASHLESS + Payme/Click (в X-отчёте это разные поля). */
public final class ZReportCashlessTotal {

    private ZReportCashlessTotal() {
    }

    public static BigDecimal of(BigDecimal cashlessAmount, BigDecimal paymeAmount) {
        BigDecimal a = cashlessAmount != null ? cashlessAmount : BigDecimal.ZERO;
        BigDecimal b = paymeAmount != null ? paymeAmount : BigDecimal.ZERO;
        return a.add(b);
    }
}
