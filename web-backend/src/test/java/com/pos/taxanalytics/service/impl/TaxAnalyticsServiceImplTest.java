package com.pos.taxanalytics.service.impl;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TaxAnalyticsServiceImplTest {

    @Test
    void shareAndDelta() {
        assertEquals(new BigDecimal("50.0"), TaxAnalyticsServiceImpl.share(1, 2));
        assertNull(TaxAnalyticsServiceImpl.share(1, 0));
        assertEquals(new BigDecimal("25.0"), TaxAnalyticsServiceImpl.deltaPct(new BigDecimal("125"), new BigDecimal("100")));
        assertNull(TaxAnalyticsServiceImpl.deltaPct(new BigDecimal("10"), BigDecimal.ZERO));
        assertEquals(new BigDecimal("80.0"), TaxAnalyticsServiceImpl.shareAmount(new BigDecimal("80"), new BigDecimal("100")));
    }
}
