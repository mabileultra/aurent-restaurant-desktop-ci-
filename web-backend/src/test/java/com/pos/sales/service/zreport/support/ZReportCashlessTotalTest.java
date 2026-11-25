package com.pos.sales.service.zreport.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ZReportCashlessTotalTest {

    @Test
    void sumsQrAndPaymeClick() {
        assertEquals(
            new BigDecimal("1500"),
            ZReportCashlessTotal.of(new BigDecimal("500"), new BigDecimal("1000"))
        );
    }

    @Test
    void nullsAsZero() {
        assertEquals(BigDecimal.ZERO, ZReportCashlessTotal.of(null, null));
        assertEquals(new BigDecimal("10"), ZReportCashlessTotal.of(new BigDecimal("10"), null));
        assertEquals(new BigDecimal("7"), ZReportCashlessTotal.of(null, new BigDecimal("7")));
    }
}
