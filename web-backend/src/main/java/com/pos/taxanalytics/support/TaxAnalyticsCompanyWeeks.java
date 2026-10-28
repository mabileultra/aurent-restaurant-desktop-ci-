package com.pos.taxanalytics.support;

import com.pos.taxanalytics.dto.TaxAnalyticsCompanyWeekResponse;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Last 8 calendar weeks, oldest first. The week before the oldest is used only for the delta. */
public final class TaxAnalyticsCompanyWeeks {

    public static final int DISPLAYED = 8;

    private TaxAnalyticsCompanyWeeks() {
    }

    public static List<TaxAnalyticsCompanyWeekResponse> build(LocalDate today, Map<LocalDate, DayTurnover> byDate) {
        LocalDate thisMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<WeekSum> sums = new ArrayList<>();
        for (int ago = DISPLAYED; ago >= 0; ago--) {
            LocalDate start = thisMonday.minusWeeks(ago);
            LocalDate end = ago == 0 ? today : start.plusDays(6);
            BigDecimal fiscal = BigDecimal.ZERO;
            BigDecimal nonFiscal = BigDecimal.ZERO;
            for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
                DayTurnover dayTurnover = byDate.get(day);
                if (dayTurnover == null) {
                    continue;
                }
                fiscal = fiscal.add(dayTurnover.fiscal());
                nonFiscal = nonFiscal.add(dayTurnover.nonFiscal());
            }
            sums.add(new WeekSum(start, end, fiscal, nonFiscal));
        }

        List<TaxAnalyticsCompanyWeekResponse> weeks = new ArrayList<>();
        for (int i = 1; i < sums.size(); i++) {
            WeekSum current = sums.get(i);
            WeekSum previous = sums.get(i - 1);
            BigDecimal total = current.fiscal.add(current.nonFiscal);
            BigDecimal prevTotal = previous.fiscal.add(previous.nonFiscal);
            weeks.add(new TaxAnalyticsCompanyWeekResponse(
                current.start.toString(),
                current.end.toString(),
                current.fiscal,
                current.nonFiscal,
                total,
                TaxAnalyticsWeekMath.deltaAmount(total, prevTotal),
                TaxAnalyticsWeekMath.deltaPct(total, prevTotal)
            ));
        }
        return weeks;
    }

    public record DayTurnover(BigDecimal fiscal, BigDecimal nonFiscal) {
    }

    private record WeekSum(LocalDate start, LocalDate end, BigDecimal fiscal, BigDecimal nonFiscal) {
    }
}
