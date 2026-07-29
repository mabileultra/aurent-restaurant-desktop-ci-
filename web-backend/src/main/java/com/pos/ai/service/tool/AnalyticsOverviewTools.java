package com.pos.ai.service.tool;

import com.pos.client.reporting.ReportingSalesReportClient;
import com.pos.client.reporting.ReportingShiftReportClient;
import com.pos.client.reporting.ReportingStockReportClient;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.dto.report.shift.ShiftOverviewResponse;
import com.pos.dto.report.stock.StockCatalogStatsResponse;
import com.pos.catalog.repository.CategoryRepository;
import com.pos.repository.StoreRepository;
import com.pos.ai.service.AiAnalyticsMaps;
import com.pos.ai.service.AiAssistantParallel;
import com.pos.ai.service.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.pos.ai.service.support.AnalyticsPeriodSupport.period;

@Component
@RequiredArgsConstructor
public class AnalyticsOverviewTools {

    private final ReportingSalesReportClient reportingSalesReportClient;
    private final ReportingShiftReportClient reportingShiftReportClient;
    private final ReportingStockReportClient reportingStockReportClient;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;
    private final AnalyticsSalesTools salesTools;
    private final AnalyticsStockInsightTools stockInsightTools;
    private final AiAssistantParallel parallel;

    public Map<String, Object> businessHealthCheck(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 29);
        long days = Math.max(1, ChronoUnit.DAYS.between(range.from(), range.to()) + 1);
        LocalDate prevTo = range.from().minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);

        CompletableFuture<SalesReportResponse> currentF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(range.from(), range.to())
        );
        CompletableFuture<SalesReportResponse> previousF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(prevFrom, prevTo)
        );
        CompletableFuture<Map<String, Object>> returnsF = parallel.supply(
            () -> salesTools.returnsSummaryPeriod(range.from(), range.to(), companyId)
        );
        CompletableFuture<Map<String, Object>> topProductsF = parallel.supply(
            () -> salesTools.topProductsPeriod(range.from(), range.to(), 5)
        );
        CompletableFuture<Map<String, Object>> storeInsightF = parallel.supply(
            () -> stockInsightTools.storeChartSummary(range.from(), range.to(), companyId)
        );
        AiAssistantParallel.awaitAll(currentF, previousF, returnsF, topProductsF, storeInsightF);

        SalesReportResponse current = currentF.join();
        SalesReportResponse previous = previousF.join();
        Map<String, Object> returns = returnsF.join();
        Map<String, Object> topProducts = topProductsF.join();
        Map<String, Object> storeInsight = storeInsightF.join();

        BigDecimal curRevenue = current.totalRevenue() != null ? current.totalRevenue() : BigDecimal.ZERO;
        BigDecimal prevRevenue = previous.totalRevenue() != null ? previous.totalRevenue() : BigDecimal.ZERO;
        BigDecimal delta = curRevenue.subtract(prevRevenue);
        BigDecimal returnsAmount = returns.get("returnsAmount") instanceof BigDecimal b ? b : BigDecimal.ZERO;
        long returnsCount = returns.get("returnsCount") instanceof Number n ? n.longValue() : 0L;
        long lowStockCount = reportingStockReportClient.catalogStats().lowStockSkus();

        List<Map<String, Object>> topItems = normalizeTopProducts(topProducts);
        List<Map<String, Object>> decliningProducts = findDecliningProducts(topItems);
        List<Map<String, Object>> storesWithIssues = findStoresWithIssues(storeInsight);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("previousFrom", prevFrom.toString());
        out.put("previousTo", prevTo.toString());
        out.put("currentRevenue", curRevenue);
        out.put("previousRevenue", prevRevenue);
        out.put("revenueDelta", delta);
        out.put("returnsAmount", returnsAmount);
        out.put("returnsCount", returnsCount);
        out.put("lowStockCount", lowStockCount);
        out.put("topProducts", topItems);
        out.put("decliningProducts", decliningProducts);
        out.put("storesWithLowStockButHighSales", storesWithIssues);
        out.put("storeChart", storeInsight.getOrDefault("chart", List.of()));
        out.put("storeSuggestions", List.of());
        out.put("recommendedActions", buildRecommendedActions(delta, decliningProducts, storesWithIssues, returnsCount));
        out.put("chart", storeInsight.getOrDefault("chart", List.of()));
        return out;
    }

    public Map<String, Object> executiveSystemOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);

        CompletableFuture<SalesReportResponse> salesF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(range.from(), range.to())
        );
        CompletableFuture<List<TopProductRow>> topProductsF = parallel.supply(
            () -> reportingSalesReportClient.topProducts(5, range.from(), range.to())
        );
        CompletableFuture<List<StoreSalesRowResponse>> storesRawF = parallel.supply(
            () -> reportingSalesReportClient.salesByStores(range.from(), range.to(), 0, 100).content()
        );
        CompletableFuture<StockCatalogStatsResponse> catalogStatsF = parallel.supply(
            () -> reportingStockReportClient.catalogStats()
        );
        CompletableFuture<Long> categoryCountF = parallel.supply(
            () -> categoryRepository.countByCompanyId(companyId)
        );
        CompletableFuture<Long> storeCountF = parallel.supply(
            () -> storeRepository.countByCompanyId(companyId)
        );
        CompletableFuture<Long> activeStoreCountF = parallel.supply(
            () -> storeRepository.countByCompanyIdAndActiveTrue(companyId)
        );
        CompletableFuture<ShiftOverviewResponse> shiftOverviewF = parallel.supply(
            () -> reportingShiftReportClient.overview(range.from(), range.to(), 1)
        );
        CompletableFuture<Map<String, Object>> returnsF = parallel.supply(
            () -> salesTools.returnsSummaryPeriod(range.from(), range.to(), companyId)
        );
        AiAssistantParallel.awaitAll(
            salesF, topProductsF, storesRawF, catalogStatsF,
            categoryCountF, storeCountF, activeStoreCountF, shiftOverviewF, returnsF
        );

        SalesReportResponse sales = salesF.join();
        List<TopProductRow> topProducts = topProductsF.join();
        List<StoreSalesRowResponse> storesRaw = storesRawF.join();
        List<Map<String, Object>> topStores = storesRaw.stream()
            .sorted(Comparator.comparing(StoreSalesRowResponse::revenue, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .map(row -> {
                Map<String, Object> one = new LinkedHashMap<>();
                one.put("storeId", row.storeId());
                one.put("storeName", row.storeName() != null ? row.storeName() : "—");
                one.put("revenue", row.revenue());
                one.put("checks", row.receiptCount());
                return one;
            })
            .toList();

        ShiftOverviewResponse shiftOverview = shiftOverviewF.join();
        Map<String, Object> returns = returnsF.join();
        var catalogStats = catalogStatsF.join();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("sales", AiAnalyticsMaps.salesBlock(sales));
        Map<String, Object> returnsBlock = AiAnalyticsMaps.create();
        returnsBlock.put("count", returns.get("returnsCount"));
        returnsBlock.put("amount", AiAnalyticsMaps.safe(returns.get("returnsAmount")));
        out.put("returns", returnsBlock);
        out.put("catalog", Map.of(
            "products", catalogStats.activeProducts(),
            "categories", categoryCountF.join(),
            "lowStockProducts", catalogStats.lowStockSkus()
        ));
        out.put("stores", Map.of(
            "total", storeCountF.join(),
            "active", activeStoreCountF.join(),
            "withSales", storesRaw.size(),
            "top", topStores
        ));
        Map<String, Object> zReportsBlock = AiAnalyticsMaps.create();
        zReportsBlock.put("countInPeriod", shiftOverview.periodCount());
        zReportsBlock.put("totalAmountInPeriod", shiftOverview.periodTotalAmount());
        zReportsBlock.put("totalInSystem", shiftOverview.totalInSystem());
        out.put("zReports", zReportsBlock);
        out.put("topProducts", topProducts);
        return out;
    }

    private static List<Map<String, Object>> normalizeTopProducts(Map<String, Object> topProducts) {
        List<Map<String, Object>> topItems = new ArrayList<>();
        Object rawTopItems = topProducts.get("items");
        if (!(rawTopItems instanceof List<?> rows)) {
            return topItems;
        }
        for (Object row : rows) {
            if (row instanceof Map<?, ?> map) {
                Map<String, Object> one = new LinkedHashMap<>();
                one.put("productName", map.get("productName"));
                one.put("quantitySold", map.get("quantitySold"));
                one.put("revenue", map.get("revenue"));
                topItems.add(one);
            } else if (row instanceof TopProductRow dto) {
                Map<String, Object> one = new LinkedHashMap<>();
                one.put("productName", dto.productName());
                one.put("quantitySold", dto.quantitySold());
                one.put("revenue", null);
                topItems.add(one);
            }
        }
        return topItems;
    }

    private static List<Map<String, Object>> findDecliningProducts(List<Map<String, Object>> topItems) {
        List<Map<String, Object>> decliningProducts = new ArrayList<>();
        for (Map<String, Object> item : topItems) {
            Object revenue = item.get("revenue");
            Object quantitySold = item.get("quantitySold");
            if ((revenue instanceof Number && ((Number) revenue).doubleValue() < 1000)
                || (quantitySold instanceof Number && ((Number) quantitySold).longValue() < 10)) {
                decliningProducts.add(item);
            }
        }
        return decliningProducts;
    }

    private static List<Map<String, Object>> findStoresWithIssues(Map<String, Object> storeInsight) {
        List<Map<String, Object>> storesWithIssues = new ArrayList<>();
        Object storesRaw = storeInsight.get("stores");
        if (!(storesRaw instanceof List<?> stores)) {
            return storesWithIssues;
        }
        for (Object storeObj : stores) {
            if (!(storeObj instanceof Map<?, ?> store)) {
                continue;
            }
            Number stockQty = (Number) store.get("stockQty");
            Number revenue = (Number) store.get("revenue");
            String storeName = String.valueOf(store.get("storeName"));
            if (stockQty != null && revenue != null
                && stockQty.longValue() < 50 && revenue.doubleValue() > 5000) {
                Map<String, Object> issue = new LinkedHashMap<>();
                issue.put("storeName", storeName);
                issue.put("stockQty", stockQty);
                issue.put("revenue", revenue);
                storesWithIssues.add(issue);
            }
        }
        return storesWithIssues;
    }

    private static List<String> buildRecommendedActions(
        BigDecimal delta,
        List<Map<String, Object>> decliningProducts,
        List<Map<String, Object>> storesWithIssues,
        long returnsCount
    ) {
        List<String> simpleActions = new ArrayList<>();
        if (delta.compareTo(BigDecimal.ZERO) < 0 && !decliningProducts.isEmpty()) {
            Map<String, Object> firstDeclining = decliningProducts.get(0);
            simpleActions.add("Sales declined. Check " + firstDeclining.get("productName") + " - it underperformed.");
        } else if (delta.compareTo(BigDecimal.ZERO) > 0) {
            simpleActions.add("Revenue growing. Focus on top performers.");
        }
        if (!storesWithIssues.isEmpty()) {
            Map<String, Object> firstIssue = storesWithIssues.get(0);
            simpleActions.add(firstIssue.get("storeName") + " has low stock (" + firstIssue.get("stockQty")
                + ") but good sales (" + firstIssue.get("revenue") + "). Restock urgently.");
        }
        if (returnsCount > 0) {
            simpleActions.add("Returns detected. Review return reasons.");
        }
        return simpleActions;
    }
}
