package com.pos.sales.service.zreport.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ZReportLeftoverDocumentTest {

    private static final Instant OPENED = Instant.parse("2026-09-11T10:27:57Z");

    @Test
    void hidesEmptyCloseAFewSecondsAfterPeriodReset() {
        assertThat(ZReportLeftoverDocument.hideFromList(
            OPENED.plusSeconds(12),
            OPENED.plusSeconds(22),
            0,
            BigDecimal.ZERO,
            0,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        )).isTrue();
    }

    @Test
    void keepsEmptyShiftThatLastedHours() {
        assertThat(ZReportLeftoverDocument.hideFromList(
            OPENED,
            OPENED.plusSeconds(8 * 3600),
            0,
            BigDecimal.ZERO,
            0,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        )).isFalse();
    }

    @Test
    void keepsShortDocumentWhenItHasSales() {
        assertThat(ZReportLeftoverDocument.hideFromList(
            OPENED,
            OPENED.plusSeconds(20),
            3,
            new BigDecimal("280000.00"),
            0,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO
        )).isFalse();
    }
}
