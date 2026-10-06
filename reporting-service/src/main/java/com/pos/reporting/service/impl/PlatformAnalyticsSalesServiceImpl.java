package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse.PlatformSalesDailyPoint;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse.PlatformSalesHour;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse.PlatformSalesKpi;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse.PlatformSalesPeak;
import com.pos.reporting.dto.platform.PlatformAnalyticsSalesResponse.PlatformSalesWeekday;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
import com.pos.reporting.service.PlatformAnalyticsSalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformAnalyticsSalesServiceImpl implements PlatformAnalyticsSalesService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd.MM");
    private static final String[] WEEKDAYS = {"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"};

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsSalesResponse sales(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());

        Object[] curSales = asRow(repository.saleTotals(range.from(), range.to()));
        Object[] prevSales = asRow(repository.saleTotals(range.prevFrom(), range.prevTo()));
        Object[] curItems = asRow(repository.itemTotals(range.from(), range.to()));
        Object[] prevItems = asRow(repository.itemTotals(range.prevFrom(), range.prevTo()));

        BigDecimal turnover = moneyAt(curSales, 0);
        BigDecimal prevTurnover = moneyAt(prevSales, 0);
        long receipts = longAt(curSales, 1);
        long prevReceipts = longAt(prevSales, 1);
        BigDecimal profit = moneyAt(curItems, 0).subtract(moneyAt(curItems, 1));
        BigDecimal prevProfit = moneyAt(prevItems, 0).subtract(moneyAt(prevItems, 1));
        BigDecimal avgCheck = avg(turnover, receipts);
        BigDecimal prevAvg = avg(prevTurnover, prevReceipts);

        List<PlatformSalesDailyPoint> daily = buildDaily(range.from(), range.to());
        PlatformSalesPeak peakDay = daily.stream()
            .filter(PlatformSalesDailyPoint::best)
            .findFirst()
            .map(d -> new PlatformSalesPeak(
                d.label(),
                d.turnover(),
                share(d.turnover(), turnover)
            ))
            .orElse(null);

        List<PlatformSalesWeekday> weekdays = buildWeekdays(range.from(), range.to(), turnover);
        List<PlatformSalesHour> hourly = buildHourly(range.from(), range.to(), turnover);
        PlatformSalesPeak peakHour = hourly.stream()
            .max((a, b) -> a.turnover().compareTo(b.turnover()))
            .filter(h -> h.turnover().signum() > 0)
            .map(h -> new PlatformSalesPeak(h.hour() + ":00", h.turnover(), h.sharePct()))
            .orElse(null);

        return new PlatformAnalyticsSalesResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            new PlatformSalesKpi(
                turnover,
                profit,
                receipts,
                avgCheck,
                PlatformAnalyticsOverviewServiceImpl.deltaPct(turnover, prevTurnover),
                PlatformAnalyticsOverviewServiceImpl.deltaPct(profit, prevProfit),
                PlatformAnalyticsOverviewServiceImpl.deltaPct(
                    BigDecimal.valueOf(receipts),
                    BigDecimal.valueOf(prevReceipts)
                ),
                PlatformAnalyticsOverviewServiceImpl.deltaPct(avgCheck, prevAvg)
            ),
            daily,
            weekdays,
            hourly,
            true,
            peakDay,
            peakHour
        );
    }

    private List<PlatformSalesDailyPoint> buildDaily(LocalDate from, LocalDate to) {
        Map<LocalDate, Object[]> salesByDay = new HashMap<>();
        for (Object[] row : repository.dailySales(from, to)) {
            salesByDay.put(toDate(row[0]), row);
        }
        Map<LocalDate, BigDecimal> profitByDay = new HashMap<>();
        for (Object[] row : repository.dailyProfit(from, to)) {
            profitByDay.put(toDate(row[0]), moneyAt(row, 1));
        }

        List<PlatformSalesDailyPoint> points = new ArrayList<>();
        BigDecimal bestTurnover = BigDecimal.valueOf(-1);
        LocalDate bestDay = null;
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            Object[] sales = salesByDay.get(day);
            BigDecimal turnover = sales != null ? moneyAt(sales, 1) : BigDecimal.ZERO;
            long receipts = sales != null ? longAt(sales, 2) : 0L;
            BigDecimal profit = profitByDay.getOrDefault(day, BigDecimal.ZERO);
            points.add(new PlatformSalesDailyPoint(
                day.toString(),
                day.format(DAY_LABEL),
                turnover,
                profit,
                receipts,
                avg(turnover, receipts),
                false
            ));
            if (turnover.compareTo(bestTurnover) > 0) {
                bestTurnover = turnover;
                bestDay = day;
            }
        }
        if (bestDay == null || bestTurnover.signum() <= 0) {
            return points;
        }
        LocalDate marked = bestDay;
        return points.stream()
            .map(p -> p.date().equals(marked.toString())
                ? new PlatformSalesDailyPoint(p.date(), p.label(), p.turnover(), p.profit(), p.receipts(), p.avgCheck(), true)
                : p)
            .toList();
    }

    private List<PlatformSalesWeekday> buildWeekdays(LocalDate from, LocalDate to, BigDecimal total) {
        Map<Integer, BigDecimal> byDow = new HashMap<>();
        for (Object[] row : repository.weekdaySales(from, to)) {
            byDow.put(((Number) row[0]).intValue(), moneyAt(row, 1));
        }
        BigDecimal peak = BigDecimal.valueOf(-1);
        int peakDow = 6;
        List<PlatformSalesWeekday> draft = new ArrayList<>();
        for (int dow = 1; dow <= 7; dow++) {
            BigDecimal value = byDow.getOrDefault(dow, BigDecimal.ZERO);
            if (value.compareTo(peak) > 0) {
                peak = value;
                peakDow = dow;
            }
            draft.add(new PlatformSalesWeekday(WEEKDAYS[dow - 1], value, share(value, total), false));
        }
        int marked = peakDow;
        boolean hasPeak = peak.signum() > 0;
        return draft.stream()
            .map(r -> new PlatformSalesWeekday(
                r.day(),
                r.turnover(),
                r.sharePct(),
                hasPeak && indexOfWeekday(r.day()) == marked
            ))
            .toList();
    }

    private List<PlatformSalesHour> buildHourly(LocalDate from, LocalDate to, BigDecimal total) {
        Map<Integer, Object[]> byHour = new HashMap<>();
        for (Object[] row : repository.hourlySalesApprox(from, to)) {
            byHour.put(((Number) row[0]).intValue(), row);
        }
        List<PlatformSalesHour> hours = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            Object[] row = byHour.get(h);
            BigDecimal turnover = row != null ? moneyAt(row, 1) : BigDecimal.ZERO;
            long receipts = row != null ? longAt(row, 2) : 0L;
            hours.add(new PlatformSalesHour(
                String.format("%02d", h),
                turnover,
                receipts,
                share(turnover, total)
            ));
        }
        return hours;
    }

    private static BigDecimal avg(BigDecimal total, long count) {
        if (count <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private static BigDecimal share(BigDecimal part, BigDecimal total) {
        if (total == null || total.signum() == 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP);
    }

    private static Object[] asRow(Object raw) {
        if (raw == null) {
            return new Object[0];
        }
        if (raw instanceof Object[] arr) {
            return arr;
        }
        return new Object[]{raw};
    }

    private static long longAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return 0L;
        }
        return ((Number) row[idx]).longValue();
    }

    private static BigDecimal moneyAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        Object value = row[idx];
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate toDate(Object value) {
        if (value instanceof LocalDate d) {
            return d;
        }
        if (value instanceof java.sql.Date d) {
            return d.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }

    private static int indexOfWeekday(String day) {
        for (int i = 0; i < WEEKDAYS.length; i++) {
            if (WEEKDAYS[i].equals(day)) {
                return i + 1;
            }
        }
        return 1;
    }
}
