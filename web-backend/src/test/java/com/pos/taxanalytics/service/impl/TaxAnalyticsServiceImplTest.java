package com.pos.taxanalytics.service.impl;

import com.pos.taxanalytics.support.TaxAnalyticsMath;
import com.pos.taxanalytics.support.TaxAnalyticsRegionFilter;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxAnalyticsServiceImplTest {

    @Test
    void shareAndDelta() {
        assertEquals(new BigDecimal("50.0"), TaxAnalyticsMath.share(1, 2));
        assertNull(TaxAnalyticsMath.share(1, 0));
        assertEquals(new BigDecimal("25.0"), TaxAnalyticsMath.deltaPct(new BigDecimal("125"), new BigDecimal("100")));
        assertNull(TaxAnalyticsMath.deltaPct(new BigDecimal("10"), BigDecimal.ZERO));
        assertEquals(new BigDecimal("80.0"), TaxAnalyticsMath.shareAmount(new BigDecimal("80"), new BigDecimal("100")));
    }

    @Test
    void missingRegionCodeIsTheUnassignedBucket() {
        assertTrue(TaxAnalyticsRegionFilter.isMissing("0"));
        assertEquals("Hududi ko'rsatilmagan", TaxAnalyticsRegionFilter.MISSING_NAME_UZ);
    }
}
