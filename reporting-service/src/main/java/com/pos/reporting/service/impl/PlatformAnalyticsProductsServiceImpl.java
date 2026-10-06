package com.pos.reporting.service.impl;

import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse.PlatformCategoryRow;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse.PlatformProductKpi;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse.PlatformProductRank;
import com.pos.reporting.dto.platform.PlatformAnalyticsProductsResponse.PlatformProductRow;
import com.pos.reporting.repository.PlatformAnalyticsOverviewRepository;
import com.pos.reporting.util.NativeAggregateRowSupport;
import com.pos.reporting.service.PlatformAnalyticsPeriod;
import com.pos.reporting.service.PlatformAnalyticsProductsService;
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
public class PlatformAnalyticsProductsServiceImpl implements PlatformAnalyticsProductsService {

    private static final int PRODUCT_LIMIT = 300;
    private static final int TOP_LIMIT = 5;
    private static final int CATEGORY_LIMIT = 20;

    private final PlatformAnalyticsOverviewRepository repository;

    @Override
    public PlatformAnalyticsProductsResponse products(String period, LocalDate from, LocalDate to) {
        PlatformAnalyticsPeriod range = PlatformAnalyticsPeriod.resolve(period, from, to, LocalDate.now());

        Object[] totals = NativeAggregateRowSupport.normalize(repository.productKpiTotals(range.from(), range.to()));
        long soldQty = NativeAggregateRowSupport.toLong(totals, 0);
        BigDecimal revenue = NativeAggregateRowSupport.toBigDecimal(totals, 1);
        BigDecimal cost = NativeAggregateRowSupport.toBigDecimal(totals, 2);
        BigDecimal profit = NativeAggregateRowSupport.toBigDecimal(totals, 3);
        BigDecimal marginPct = margin(profit, revenue);

        Map<String, BigDecimal> prevQty = toQtyMap(repository.productQtyByName(range.prevFrom(), range.prevTo()));

        List<PlatformProductRow> products = new ArrayList<>();
        for (Object[] row : repository.productSalesRows(range.from(), range.to(), PRODUCT_LIMIT)) {
            String name = str(row[0]);
            long qty = NativeAggregateRowSupport.toLong(row, 1);
            BigDecimal rowRevenue = NativeAggregateRowSupport.toBigDecimal(row, 2);
            BigDecimal rowCost = NativeAggregateRowSupport.toBigDecimal(row, 3);
            BigDecimal rowProfit = NativeAggregateRowSupport.toBigDecimal(row, 4);
            BigDecimal growth = PlatformAnalyticsOverviewServiceImpl.deltaPct(
                BigDecimal.valueOf(qty),
                prevQty.getOrDefault(name, BigDecimal.ZERO)
            );
            products.add(new PlatformProductRow(
                name,
                qty,
                rowRevenue,
                rowCost,
                rowProfit,
                margin(rowProfit, rowRevenue),
                growth
            ));
        }

        List<PlatformProductRank> topByQty = products.stream()
            .sorted(Comparator.comparingLong(PlatformProductRow::qty).reversed())
            .limit(TOP_LIMIT)
            .map(p -> new PlatformProductRank(p.name(), BigDecimal.valueOf(p.qty())))
            .toList();

        List<PlatformProductRank> topByProfit = products.stream()
            .sorted(Comparator.comparing(PlatformProductRow::profit).reversed())
            .limit(TOP_LIMIT)
            .map(p -> new PlatformProductRank(p.name(), p.profit()))
            .toList();

        List<PlatformProductRank> rising = products.stream()
            .filter(p -> p.growthPct() != null && p.growthPct().signum() > 0)
            .sorted(Comparator.comparing(PlatformProductRow::growthPct).reversed())
            .limit(TOP_LIMIT)
            .map(p -> new PlatformProductRank(p.name(), p.growthPct()))
            .toList();

        List<PlatformProductRank> falling = products.stream()
            .filter(p -> p.growthPct() != null && p.growthPct().signum() < 0)
            .sorted(Comparator.comparing(PlatformProductRow::growthPct))
            .limit(TOP_LIMIT)
            .map(p -> new PlatformProductRank(p.name(), p.growthPct().abs()))
            .toList();

        List<PlatformCategoryRow> categories = repository.categorySalesRows(range.from(), range.to(), CATEGORY_LIMIT)
            .stream()
            .map(row -> new PlatformCategoryRow(str(row[0]), NativeAggregateRowSupport.toLong(row, 1), NativeAggregateRowSupport.toBigDecimal(row, 2), NativeAggregateRowSupport.toBigDecimal(row, 3)))
            .toList();

        return new PlatformAnalyticsProductsResponse(
            range.key(),
            range.from().toString(),
            range.to().toString(),
            false,
            new PlatformProductKpi(soldQty, revenue, cost, profit, marginPct),
            products,
            topByQty,
            topByProfit,
            rising,
            falling,
            categories
        );
    }

    private static BigDecimal margin(BigDecimal profit, BigDecimal revenue) {
        if (revenue == null || revenue.signum() == 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }
        return profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 1, RoundingMode.HALF_UP);
    }

    private static Map<String, BigDecimal> toQtyMap(List<Object[]> rows) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put(str(row[0]), BigDecimal.valueOf(NativeAggregateRowSupport.toLong(row, 1)));
        }
        return map;
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString();
    }
}
