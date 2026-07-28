package com.pos.ai.service.tool;

import com.pos.client.reporting.ReportingSalesReportClient;
import com.pos.dto.report.ReturnsSummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.dto.report.TopProductRow;
import com.pos.dto.report.sales.StoreSalesRowResponse;
import com.pos.ai.service.AiAnalyticsMaps;
import com.pos.ai.service.AiAssistantParallel;
import com.pos.ai.service.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.pos.ai.service.support.AnalyticsPeriodSupport.period;
import static com.pos.ai.service.support.AnalyticsPeriodSupport.today;

@Component
@RequiredArgsConstructor
public class AnalyticsSalesTools {

    private final ReportingSalesReportClient reportingSalesReportClient;
    private final AiAssistantParallel parallel;

    public Map<String, Object> salesPeriodOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        CompletableFuture<SalesReportResponse> salesF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(range.from(), range.to())
        );
        CompletableFuture<List<StoreSalesRowResponse>> storesF = parallel.supply(
            () -> reportingSalesReportClient.salesByStores(range.from(), range.to(), 0, 5).content()
        );
        AiAssistantParallel.awaitAll(salesF, storesF);

        SalesReportResponse sales = salesF.join();
        List<Map<String, Object>> stores = storesF.join().stream()
            .map(row -> {
                Map<String, Object> one = AiAnalyticsMaps.create();
                one.put("storeName", row.storeName() != null ? row.storeName() : "—");
                one.put("revenue", AiAnalyticsMaps.safe(row.revenue()));
                one.put("checks", row.receiptCount());
                return one;
            })
            .toList();

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("revenue", AiAnalyticsMaps.money(sales.totalRevenue()));
        out.put("transactions", sales.transactionCount());
        out.put("averageCheck", AiAnalyticsMaps.money(sales.averageTransactionValue()));
        out.put("stores", stores);
        return out;
    }

    public Map<String, Object> todayRevenue(Integer companyId) {
        LocalDate today = today();
        LocalDate chartFrom = today.minusDays(6);

        CompletableFuture<SalesReportResponse> todayF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(today, today)
        );
        CompletableFuture<SalesReportResponse> chartF = parallel.supply(
            () -> reportingSalesReportClient.salesReport(chartFrom, today)
        );
        AiAssistantParallel.awaitAll(todayF, chartF);

        SalesReportResponse report = todayF.join();
        List<Map<String, Object>> chart = new ArrayList<>();
        SalesReportResponse chartReport = chartF.join();
        if (chartReport != null && chartReport.dailyBreakdown() != null) {
            for (var point : chartReport.dailyBreakdown()) {
                Map<String, Object> chartPoint = new LinkedHashMap<>();
                chartPoint.put("name", point.date());
                chartPoint.put("revenue", point.revenue());
                chartPoint.put("stockQty", 0);
                chart.add(chartPoint);
            }
        }

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("date", today.toString());
        out.put("totalRevenue", AiAnalyticsMaps.money(report.totalRevenue()));
        out.put("transactionCount", report.transactionCount());
        out.put("averageCheck", AiAnalyticsMaps.money(report.averageTransactionValue()));
        out.put("chart", chart);
        return out;
    }

    public Map<String, Object> topProductsPeriod(LocalDate from, LocalDate to, int limit) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<TopProductRow> rows = reportingSalesReportClient.topProducts(safeLimit, range.from(), range.to());
        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "items", rows
        );
    }

    public Map<String, Object> returnsSummaryPeriod(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 6);
        ReturnsSummaryResponse summary = reportingSalesReportClient.returnsSummary(range.from(), range.to());
        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "returnsCount", summary.returnsCount(),
            "returnsAmount", summary.returnsAmount()
        );
    }
}
