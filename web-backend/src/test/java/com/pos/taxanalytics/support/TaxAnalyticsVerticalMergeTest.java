package com.pos.taxanalytics.support;

import com.pos.taxanalytics.client.dto.TaxAnalyticsCompanyMoneyDto;
import com.pos.taxanalytics.dto.TaxAnalyticsCompanyRowResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaxAnalyticsVerticalMergeTest {

    @Test
    void mergeRowAddsRestaurantMoneyAndConnected() {
        TaxAnalyticsCompanyRowResponse base = new TaxAnalyticsCompanyRowResponse(
            7, "Alinur", "310849314", null, null, null, null, null, null,
            false, 1, "Hall",
            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null
        );
        TaxAnalyticsCompanyMoneyDto extra = new TaxAnalyticsCompanyMoneyDto(
            7,
            BigDecimal.ZERO,
            new BigDecimal("150000"),
            new BigDecimal("40000"),
            new BigDecimal("20000")
        );
        TaxAnalyticsCompanyRowResponse merged = TaxAnalyticsVerticalMerge.mergeRow(base, extra, true);
        assertTrue(merged.connected());
        assertEquals(new BigDecimal("150000"), merged.nonFiscalTurnover());
        assertEquals(new BigDecimal("150000"), merged.totalTurnover());
        assertEquals(new BigDecimal("40000"), merged.weekTurnover());
    }
}
