package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse.PlatformStoreRank;
import com.pos.reporting.dto.platform.PlatformAnalyticsStoresResponse.PlatformStoreRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
import com.pos.reporting.service.PlatformAnalyticsStoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlatformAnalyticsStoresServiceImpl implements PlatformAnalyticsStoresService {

    private static final int STORE_LIMIT = 300;
    private static final int TOP_LIMIT = 5;

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsStoresResponse stores(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());

        Map<Integer, BigDecimal> profitByStore = toMoneyMap(repository.storeProfitRows(range.from(), range.to()));
        Map<Integer, BigDecimal> prevTurnover = toMoneyMap(repository.storeTurnoverById(range.prevFrom(), range.prevTo()));

        List<PlatformStoreRow> stores = new ArrayList<>();
        for (Object[] row : repository.storeSalesRows(range.from(), range.to(), STORE_LIMIT)) {
            Integer storeId = intAt(row, 0);
            String name = str(row[1]);
            BigDecimal turnover = moneyAt(row, 2);
            long receipts = longAt(row, 3);
            BigDecimal profit = profitByStore.getOrDefault(storeId, BigDecimal.ZERO);
            BigDecimal avgCheck = receipts > 0
                ? turnover.divide(BigDecimal.valueOf(receipts), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
            BigDecimal growth = PlatformAnalyticsOverviewServiceImpl.deltaPct(
                turnover,
                prevTurnover.getOrDefault(storeId, BigDecimal.ZERO)
            );
            stores.add(new PlatformStoreRow(storeId, name, turnover, profit, receipts, avgCheck, growth));
        }

        List<PlatformStoreRank> topTurnover = stores.stream()
            .sorted(Comparator.comparing(PlatformStoreRow::turnover).reversed())
            .limit(TOP_LIMIT)
            .map(s -> new PlatformStoreRank(s.storeId(), s.name(), s.turnover()))
            .toList();

        List<PlatformStoreRank> topProfit = stores.stream()
            .sorted(Comparator.comparing(PlatformStoreRow::profit).reversed())
            .limit(TOP_LIMIT)
            .map(s -> new PlatformStoreRank(s.storeId(), s.name(), s.profit()))
            .toList();

        return new PlatformAnalyticsStoresResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            stores,
            topTurnover,
            topProfit
        );
    }

    private static Map<Integer, BigDecimal> toMoneyMap(List<Object[]> rows) {
        Map<Integer, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            Integer id = intAt(row, 0);
            if (id != null) {
                map.put(id, moneyAt(row, 1));
            }
        }
        return map;
    }

    private static Integer intAt(Object[] row, int idx) {
        if (row == null || idx >= row.length || row[idx] == null) {
            return null;
        }
        return ((Number) row[idx]).intValue();
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

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
