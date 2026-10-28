package com.pos.taxanalytics.support;

import com.pos.taxanalytics.dto.TaxAnalyticsCompanyDayResponse;
import com.pos.taxanalytics.support.TaxAnalyticsCompanyWeeks.DayTurnover;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Days of the selected period, newest first. Long ranges keep the latest 31 days. */
public final class TaxAnalyticsCompanyDays {

    public static final int MAX_DAYS = 31;

    private TaxAnalyticsCompanyDays() {
    }

    public static List<TaxAnalyticsCompanyDayResponse> build(
        LocalDate from,
        LocalDate to,
        Map<LocalDate, DayTurnover> byDate
    ) {
        LocalDate end = to.isBefore(from) ? from : to;
        LocalDate start = from;
        if (end.toEpochDay() - start.toEpochDay() + 1 > MAX_DAYS) {
            start = end.minusDays(MAX_DAYS - 1);
        }
        List<TaxAnalyticsCompanyDayResponse> days = new ArrayList<>();
        for (LocalDate day = end; !day.isBefore(start); day = day.minusDays(1)) {
            DayTurnover turnover = byDate.get(day);
            BigDecimal fiscal = turnover == null ? BigDecimal.ZERO : turnover.fiscal();
            BigDecimal nonFiscal = turnover == null ? BigDecimal.ZERO : turnover.nonFiscal();
            days.add(new TaxAnalyticsCompanyDayResponse(
                day.toString(),
                fiscal,
                nonFiscal,
                fiscal.add(nonFiscal)
            ));
        }
        return days;
    }
}
