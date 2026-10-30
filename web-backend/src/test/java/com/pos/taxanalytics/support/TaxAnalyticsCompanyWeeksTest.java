package com.pos.taxanalytics.support;

import com.pos.taxanalytics.dto.TaxAnalyticsCompanyWeekResponse;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks.DayTurnover;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TaxAnalyticsCompanyWeeksTest {

    @Test
    void buildsEightWeeksAndComparesEachToThePrevious() {
        LocalDate today = LocalDate.of(2026, 10, 28);
        Map<LocalDate, DayTurnover> days = Map.of(
            LocalDate.of(2026, 10, 20), new DayTurnover(new BigDecimal("40"), new BigDecimal("60")),
            LocalDate.of(2026, 10, 27), new DayTurnover(new BigDecimal("80"), new BigDecimal("20")),
            LocalDate.of(2026, 10, 28), new DayTurnover(new BigDecimal("10"), BigDecimal.ZERO)
        );

        List<TaxAnalyticsCompanyWeekResponse> weeks = TaxAnalyticsCompanyWeeks.build(today, days);

        assertEquals(8, weeks.size());
        TaxAnalyticsCompanyWeekResponse previous = weeks.get(6);
        TaxAnalyticsCompanyWeekResponse current = weeks.get(7);
        assertEquals("2026-10-19", previous.weekFrom());
        assertEquals("2026-10-25", previous.weekTo());
        assertEquals(new BigDecimal("100"), previous.totalTurnover());
        assertEquals(new BigDecimal("40"), previous.fiscalTurnover());
        assertEquals("2026-10-26", current.weekFrom());
        assertEquals("2026-10-28", current.weekTo());
        assertEquals(new BigDecimal("110"), current.totalTurnover());
        assertEquals(new BigDecimal("90"), current.fiscalTurnover());
        assertEquals(new BigDecimal("20"), current.nonFiscalTurnover());
        assertEquals(new BigDecimal("10"), current.deltaAmount());
        assertEquals(new BigDecimal("10.0"), current.deltaPct());
        assertNull(weeks.get(0).deltaPct());
    }
}
