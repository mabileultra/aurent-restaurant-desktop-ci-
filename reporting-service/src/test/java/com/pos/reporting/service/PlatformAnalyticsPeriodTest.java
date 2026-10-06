package com.pos.reporting.service;

import com.pos.reporting.service.impl.PlatformAnalyticsOverviewServiceImpl;
import com.pos.reporting.service.impl.PlatformAnalyticsPaymentsServiceImpl;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PlatformAnalyticsPeriodTest {

    private final LocalDate today = LocalDate.of(2026, 10, 7);

    @Test
    void resolvesSevenDaysWithPreviousWindow() {
        PlatformAnalyticsPeriod p = PlatformAnalyticsPeriod.resolve("7d", null, null, today);
        assertEquals("7d", p.key());
        assertEquals(LocalDate.of(2026, 10, 1), p.from());
        assertEquals(today, p.to());
        assertEquals(LocalDate.of(2026, 9, 24), p.prevFrom());
        assertEquals(LocalDate.of(2026, 9, 30), p.prevTo());
    }

    @Test
    void resolvesToday() {
        PlatformAnalyticsPeriod p = PlatformAnalyticsPeriod.resolve("today", null, null, today);
        assertEquals(today, p.from());
        assertEquals(today, p.to());
        assertEquals(LocalDate.of(2026, 10, 6), p.prevFrom());
        assertEquals(LocalDate.of(2026, 10, 6), p.prevTo());
    }

    @Test
    void customRequiresBounds() {
        assertThrows(IllegalArgumentException.class,
            () -> PlatformAnalyticsPeriod.resolve("custom", null, today, today));
    }

    @Test
    void deltaPctHandlesGrowthAndZeroBase() {
        assertEquals(
            new BigDecimal("12.5"),
            PlatformAnalyticsOverviewServiceImpl.deltaPct(new BigDecimal("90"), new BigDecimal("80"))
        );
        assertNull(PlatformAnalyticsOverviewServiceImpl.deltaPct(new BigDecimal("10"), BigDecimal.ZERO));
    }

    @Test
    void normalizesPaymentMethodIds() {
        assertEquals("cash", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("CASH"));
        assertEquals("cash", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("наличные"));
        assertEquals("card", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("UzCard"));
        assertEquals("click", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("Click"));
        assertEquals("payme", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("payme"));
        assertEquals("other", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId(null));
        assertEquals("other", PlatformAnalyticsPaymentsServiceImpl.normalizeMethodId("unknown"));
    }
}
