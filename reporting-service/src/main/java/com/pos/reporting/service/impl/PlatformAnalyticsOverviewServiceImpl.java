package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformAnomalyRow;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformDailyPoint;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformKpiBlock;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformKpiMetric;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformNamedMetric;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformPaymentShare;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformProductProfitRow;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformProductQtyRow;
import com.pos.reporting.dto.platform.PlatformAnalyticsOverviewResponse.PlatformWeekdayRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.service.PlatformAnalyticsOverviewService;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
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
public class PlatformAnalyticsOverviewServiceImpl implements PlatformAnalyticsOverviewService {

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd.MM");
    private static final String[] WEEKDAYS = {"Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"};
    private static final int TOP_LIMIT = 5;

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsOverviewResponse overview(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());
        Object[] curSales = asRow(repository.saleTotals(range.from(), range.to()));
        Object[] prevSales = asRow(repository.saleTotals(range.prevFrom(), range.prevTo()));
        Object[] curItems = asRow(repository.itemTotals(range.from(), range.to()));
        Object[] prevItems = asRow(repository.itemTotals(range.prevFrom(), range.prevTo()));

        BigDecimal turnover = moneyAt(curSales, 0);
        BigDecimal prevTurnover = moneyAt(prevSales, 0);
        long receipts = longAt(curSales, 1);
        long prevReceipts = longAt(prevSales, 1);
        BigDecimal returns = moneyAt(curSales, 2);
        BigDecimal prevReturns = moneyAt(prevSales, 2);
        long activeStores = longAt(curSales, 4);
        long prevStores = longAt(prevSales, 4);
        BigDecimal cash = moneyAt(curSales, 5);
        BigDecimal card = moneyAt(curSales, 6);

        BigDecimal itemRevenue = moneyAt(curItems, 0);
        BigDecimal itemCost = moneyAt(curItems, 1);
        long salesQty = longAt(curItems, 2);
        BigDecimal profit = itemRevenue.subtract(itemCost);
        BigDecimal prevProfit = moneyAt(prevItems, 0).subtract(moneyAt(prevItems, 1));
        long prevSalesQty = longAt(prevItems, 2);

        BigDecimal avgCheck = receipts > 0
            ? turnover.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        BigDecimal prevAvg = prevReceipts > 0
            ? prevTurnover.divide(BigDecimal.valueOf(prevReceipts), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        PlatformKpiBlock kpi = new PlatformKpiBlock(
            metric(turnover, prevTurnover),
            metric(profit, prevProfit),
            metric(BigDecimal.valueOf(salesQty), BigDecimal.valueOf(prevSalesQty)),
            metric(BigDecimal.valueOf(receipts), BigDecimal.valueOf(prevReceipts)),
            metric(avgCheck, prevAvg),
            metric(returns, prevReturns),
            metric(BigDecimal.valueOf(activeStores), BigDecimal.valueOf(prevStores))
        );

        return new PlatformAnalyticsOverviewResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            kpi,
            buildDaily(range.from(), range.to()),
            buildTopStores(range),
            repository.topProductsByQty(range.from(), range.to(), TOP_LIMIT).stream()
                .map(row -> new PlatformProductQtyRow(str(row[0]), longAt(row, 1)))
                .toList(),
            repository.topProductsByProfit(range.from(), range.to(), TOP_LIMIT).stream()
                .map(row -> new PlatformProductProfitRow(str(row[0]), moneyAt(row, 1)))
                .toList(),
            buildWeekdays(range.from(), range.to(), turnover),
            buildPayments(cash, card, turnover),
            buildAnomalies(range)
        );
    }

    private List<PlatformDailyPoint> buildDaily(LocalDate from, LocalDate to) {
        Map<LocalDate, Object[]> salesByDay = new HashMap<>();
        for (Object[] row : repository.dailySales(from, to)) {
            salesByDay.put(toDate(row[0]), row);
        }
        Map<LocalDate, BigDecimal> profitByDay = new HashMap<>();
        for (Object[] row : repository.dailyProfit(from, to)) {
            profitByDay.put(toDate(row[0]), moneyAt(row, 1));
        }

        List<PlatformDailyPoint> points = new ArrayList<>();
        BigDecimal bestTurnover = BigDecimal.valueOf(-1);
        LocalDate bestDay = null;
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            Object[] sales = salesByDay.get(day);
            BigDecimal turnover = sales != null ? moneyAt(sales, 1) : BigDecimal.ZERO;
            long receipts = sales != null ? longAt(sales, 2) : 0L;
            BigDecimal profit = profitByDay.getOrDefault(day, BigDecimal.ZERO);
            BigDecimal avg = receipts > 0
                ? turnover.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            points.add(new PlatformDailyPoint(
                day.toString(),
                day.format(DAY_LABEL),
                turnover,
                profit,
                receipts,
                avg,
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
                ? new PlatformDailyPoint(p.date(), p.label(), p.turnover(), p.profit(), p.receipts(), p.avgCheck(), true)
                : p)
            .toList();
    }

    private List<PlatformNamedMetric> buildTopStores(PlatformAnalyticsPeriod range) {
        List<PlatformNamedMetric> rows = new ArrayList<>();
        for (Object[] row : repository.topStores(range.from(), range.to(), TOP_LIMIT)) {
            String name = str(row[0]);
            BigDecimal cur = moneyAt(row, 1);
            BigDecimal prev = toMoney(repository.storeTurnoverByName(range.prevFrom(), range.prevTo(), name));
            rows.add(new PlatformNamedMetric(name, cur, deltaPct(cur, prev)));
        }
        return rows;
    }

    private List<PlatformWeekdayRow> buildWeekdays(LocalDate from, LocalDate to, BigDecimal totalTurnover) {
        Map<Integer, BigDecimal> byDow = new HashMap<>();
        for (Object[] row : repository.weekdaySales(from, to)) {
            byDow.put(((Number) row[0]).intValue(), moneyAt(row, 1));
        }
        BigDecimal peak = BigDecimal.valueOf(-1);
        int peakDow = 6;
        List<PlatformWeekdayRow> draft = new ArrayList<>();
        for (int dow = 1; dow <= 7; dow++) {
            BigDecimal value = byDow.getOrDefault(dow, BigDecimal.ZERO);
            if (value.compareTo(peak) > 0) {
                peak = value;
                peakDow = dow;
            }
            BigDecimal share = totalTurnover.signum() > 0
                ? value.multiply(BigDecimal.valueOf(100)).divide(totalTurnover, 1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            draft.add(new PlatformWeekdayRow(WEEKDAYS[dow - 1], value, share, false));
        }
        int marked = peakDow;
        boolean hasPeak = peak.signum() > 0;
        return draft.stream()
            .map(r -> new PlatformWeekdayRow(
                r.day(),
                r.turnover(),
                r.sharePct(),
                hasPeak && indexOfWeekday(r.day()) == marked
            ))
            .toList();
    }

    private List<PlatformPaymentShare> buildPayments(BigDecimal cash, BigDecimal card, BigDecimal turnover) {
        BigDecimal other = turnover.subtract(cash).subtract(card);
        if (other.signum() < 0) {
            other = BigDecimal.ZERO;
        }
        BigDecimal base = turnover.signum() > 0 ? turnover : cash.add(card).add(other);
        return List.of(
            payment("cash", cash, base),
            payment("card", card, base),
            payment("other", other, base)
        );
    }

    private List<PlatformAnomalyRow> buildAnomalies(PlatformAnalyticsPeriod range) {
        List<PlatformAnomalyRow> out = new ArrayList<>();
        for (Object[] row : repository.storeDrops(range.from(), range.to(), range.prevFrom(), range.prevTo(), 3)) {
            BigDecimal cur = moneyAt(row, 1);
            BigDecimal prev = moneyAt(row, 2);
            BigDecimal delta = deltaPct(cur, prev);
            if (delta != null && delta.signum() < 0) {
                out.add(new PlatformAnomalyRow("danger", str(row[0]), "turnoverDown", delta.abs()));
            }
        }
        return out;
    }

    private static PlatformPaymentShare payment(String id, BigDecimal amount, BigDecimal base) {
        BigDecimal share = base.signum() > 0
            ? amount.multiply(BigDecimal.valueOf(100)).divide(base, 1, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        return new PlatformPaymentShare(id, amount, share);
    }

    private static PlatformKpiMetric metric(BigDecimal current, BigDecimal previous) {
        return new PlatformKpiMetric(current, deltaPct(current, previous));
    }

    public static BigDecimal deltaPct(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous.abs(), 1, RoundingMode.HALF_UP);
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

    private static BigDecimal moneyAt(Object[] row, int idx) {
        if (row == null || idx >= row.length) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return toMoney(row[idx]);
    }

    private static BigDecimal toMoney(Object value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof BigDecimal bd) {
            return bd.setScale(2, RoundingMode.HALF_UP);
        }
        if (value instanceof Object[] arr && arr.length > 0) {
            return toMoney(arr[0]);
        }
        return new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    private static long longAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return 0L;
        }
        return ((Number) row[idx]).longValue();
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
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
