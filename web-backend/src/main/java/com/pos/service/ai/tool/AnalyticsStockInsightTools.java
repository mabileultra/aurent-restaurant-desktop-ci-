package com.pos.service.ai.tool;

import com.pos.client.reporting.ReportingAnalyticsClient;
import com.pos.dto.report.analytics.SoldUnitsByStoreProductRowResponse;
import com.pos.dto.report.analytics.StoreProductStockRowResponse;
import com.pos.dto.report.analytics.StoreStockInsightResponse;
import com.pos.dto.report.analytics.StoreStockTotalRowResponse;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.service.ai.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.pos.service.ai.support.AnalyticsPeriodSupport.period;

@Component
@RequiredArgsConstructor
public class AnalyticsStockInsightTools {

    private final ReportingAnalyticsClient reportingAnalyticsClient;

    public Map<String, Object> stockRedistributionSuggestion(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);
        long periodDays = Math.max(1, ChronoUnit.DAYS.between(range.from(), range.to()) + 1L);
        StoreStockInsightResponse insight = reportingAnalyticsClient.storeStockInsight(range.from(), range.to());

        Map<UUID, Map<Integer, Integer>> stockByProductStore = new HashMap<>();
        Map<UUID, String> productNameById = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();

        for (StoreProductStockRowResponse row : insight.stockByProductStore()) {
            if (row.productId() == null || row.storeId() == null) {
                continue;
            }
            stockByProductStore.computeIfAbsent(row.productId(), key -> new HashMap<>())
                .put(row.storeId(), row.stockQty());
            productNameById.put(row.productId(), row.productName());
            if (row.storeName() != null) {
                storeNameById.put(row.storeId(), row.storeName());
            }
        }

        Map<UUID, Map<Integer, Long>> soldByProductStore = new HashMap<>();
        for (SoldUnitsByStoreProductRowResponse row : insight.soldByProductStore()) {
            if (row.productId() == null || row.storeId() == null) {
                continue;
            }
            soldByProductStore.computeIfAbsent(row.productId(), key -> new HashMap<>())
                .put(row.storeId(), row.soldUnits());
        }

        List<Map<String, Object>> suggestions = buildRedistributionSuggestions(
            stockByProductStore,
            soldByProductStore,
            productNameById,
            storeNameById,
            periodDays
        );

        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "periodDays", periodDays,
            "suggestions", suggestions
        );
    }

    public Map<String, Object> storeSalesAndStockInsight(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);
        StoreStockInsightResponse insight = reportingAnalyticsClient.storeStockInsight(range.from(), range.to());
        return buildStoreInsightResponse(range.from(), range.to(), insight);
    }

    public Map<String, Object> storeChartSummary(LocalDate safeFrom, LocalDate safeTo, Integer companyId) {
        StoreStockInsightResponse insight = reportingAnalyticsClient.storeStockInsight(safeFrom, safeTo);
        return buildStoreInsightResponse(safeFrom, safeTo, insight);
    }

    private Map<String, Object> buildStoreInsightResponse(
        LocalDate from,
        LocalDate to,
        StoreStockInsightResponse insight
    ) {
        StockIndex stockIndex = buildStockIndex(insight);
        Map<Integer, List<Map<String, Object>>> soldByStore = groupSoldByStore(insight, stockIndex);

        List<Map<String, Object>> stores = new ArrayList<>();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (StoreSalesRowResponse row : insight.storeSales()) {
            Integer storeId = row.storeId();
            String storeName = row.storeName() != null
                ? row.storeName()
                : stockIndex.storeNameById().getOrDefault(storeId, "—");
            Object revenue = row.revenue();
            long checks = row.receiptCount();
            long stockQty = storeId != null ? stockIndex.stockQtyByStore().getOrDefault(storeId, 0L) : 0L;
            List<Map<String, Object>> topProducts = soldByStore.getOrDefault(storeId, List.of())
                .stream()
                .limit(3)
                .toList();

            Map<String, Object> one = new LinkedHashMap<>();
            one.put("storeId", storeId);
            one.put("storeName", storeName);
            one.put("revenue", revenue);
            one.put("checks", checks);
            one.put("stockQty", stockQty);
            one.put("topProducts", topProducts);
            stores.add(one);

            Map<String, Object> point = new LinkedHashMap<>();
            point.put("name", storeName);
            point.put("revenue", revenue);
            point.put("stockQty", stockQty);
            chart.add(point);
        }

        if (from != null && to != null) {
            return Map.of(
                "from", from.toString(),
                "to", to.toString(),
                "stores", stores,
                "chart", chart
            );
        }
        return Map.of("stores", stores, "chart", chart);
    }

    private static StockIndex buildStockIndex(StoreStockInsightResponse insight) {
        Map<Integer, Long> stockQtyByStore = new HashMap<>();
        Map<Integer, String> storeNameById = new HashMap<>();
        Map<String, String> productNameByStoreProduct = new HashMap<>();

        for (StoreStockTotalRowResponse row : insight.stockTotalsByStore()) {
            if (row.storeId() == null) {
                continue;
            }
            stockQtyByStore.put(row.storeId(), row.stockQty());
            if (row.storeName() != null) {
                storeNameById.put(row.storeId(), row.storeName());
            }
        }
        for (StoreProductStockRowResponse row : insight.stockByProductStore()) {
            if (row.storeId() == null || row.productId() == null) {
                continue;
            }
            if (row.storeName() != null) {
                storeNameById.putIfAbsent(row.storeId(), row.storeName());
            }
            if (row.productName() != null) {
                productNameByStoreProduct.put(row.storeId() + ":" + row.productId(), row.productName());
            }
        }
        return new StockIndex(stockQtyByStore, storeNameById, productNameByStoreProduct);
    }

    private static Map<Integer, List<Map<String, Object>>> groupSoldByStore(
        StoreStockInsightResponse insight,
        StockIndex stockIndex
    ) {
        Map<Integer, List<Map<String, Object>>> soldByStore = new HashMap<>();
        for (SoldUnitsByStoreProductRowResponse row : insight.soldByProductStore()) {
            if (row.storeId() == null || row.productId() == null) {
                continue;
            }
            String productName = row.productName() != null
                ? row.productName()
                : stockIndex.productNameByStoreProduct().getOrDefault(row.storeId() + ":" + row.productId(), "—");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productName", productName);
            item.put("soldUnits", row.soldUnits());
            soldByStore.computeIfAbsent(row.storeId(), key -> new ArrayList<>()).add(item);
        }
        soldByStore.values().forEach(list ->
            list.sort((a, b) -> Long.compare(
                ((Number) b.get("soldUnits")).longValue(),
                ((Number) a.get("soldUnits")).longValue()
            ))
        );
        return soldByStore;
    }

    private static List<Map<String, Object>> buildRedistributionSuggestions(
        Map<UUID, Map<Integer, Integer>> stockByProductStore,
        Map<UUID, Map<Integer, Long>> soldByProductStore,
        Map<UUID, String> productNameById,
        Map<Integer, String> storeNameById,
        long periodDays
    ) {
        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Map.Entry<UUID, Map<Integer, Integer>> entry : stockByProductStore.entrySet()) {
            UUID productId = entry.getKey();
            Map<Integer, Integer> stocks = entry.getValue();
            if (stocks.size() < 2) {
                continue;
            }

            Map<Integer, Long> soldMap = soldByProductStore.getOrDefault(productId, Map.of());

            Integer fromStoreId = null;
            Integer toStoreId = null;
            double maxCoverage = -1;
            double minCoverage = Double.MAX_VALUE;

            for (Map.Entry<Integer, Integer> storeEntry : stocks.entrySet()) {
                Integer storeId = storeEntry.getKey();
                int qty = storeEntry.getValue();
                long sold = soldMap.getOrDefault(storeId, 0L);
                double daily = sold > 0 ? (double) sold / (double) periodDays : 0.0;
                double coverage = daily > 0 ? (double) qty / daily : (qty > 0 ? 9999 : 0);

                if (coverage > maxCoverage) {
                    maxCoverage = coverage;
                    fromStoreId = storeId;
                }
                if (coverage < minCoverage) {
                    minCoverage = coverage;
                    toStoreId = storeId;
                }
            }
            if (fromStoreId == null || toStoreId == null || fromStoreId.equals(toStoreId)) {
                continue;
            }

            int fromQty = stocks.getOrDefault(fromStoreId, 0);
            int toQty = stocks.getOrDefault(toStoreId, 0);
            long soldTo = soldMap.getOrDefault(toStoreId, 0L);
            long soldFrom = soldMap.getOrDefault(fromStoreId, 0L);
            double toDaily = soldTo > 0 ? (double) soldTo / (double) periodDays : 0.0;
            double fromDaily = soldFrom > 0 ? (double) soldFrom / (double) periodDays : 0.0;
            int toNeed = (int) Math.ceil(toDaily * 7.0) - toQty;
            int fromReserve = (int) Math.ceil(fromDaily * 7.0);
            int fromSurplus = Math.max(0, fromQty - fromReserve);
            int suggestedQty = Math.min(Math.max(0, toNeed), fromSurplus);
            if (suggestedQty <= 0) {
                continue;
            }

            Map<String, Object> one = new LinkedHashMap<>();
            one.put("productId", productId);
            one.put("productName", productNameById.getOrDefault(productId, "—"));
            one.put("fromStoreId", fromStoreId);
            one.put("fromStoreName", storeNameById.getOrDefault(fromStoreId, "—"));
            one.put("toStoreId", toStoreId);
            one.put("toStoreName", storeNameById.getOrDefault(toStoreId, "—"));
            one.put("suggestedQty", suggestedQty);
            one.put("fromQty", fromQty);
            one.put("toQty", toQty);
            suggestions.add(one);
        }

        suggestions.sort(Comparator.comparingInt(s -> -((Number) s.get("suggestedQty")).intValue()));
        if (suggestions.size() > 5) {
            return suggestions.subList(0, 5);
        }
        return suggestions;
    }

    private record StockIndex(
        Map<Integer, Long> stockQtyByStore,
        Map<Integer, String> storeNameById,
        Map<String, String> productNameByStoreProduct
    ) {
    }
}
