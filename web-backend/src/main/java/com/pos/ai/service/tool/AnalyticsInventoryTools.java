package com.pos.ai.service.tool;

import com.pos.client.reporting.ReportingShiftReportClient;
import com.pos.client.reporting.ReportingStockReportClient;
import com.pos.dto.report.shift.ShiftOverviewResponse;
import com.pos.dto.report.shift.ShiftReportRowResponse;
import com.pos.ai.service.AiAnalyticsMaps;
import com.pos.ai.service.AiAssistantParallel;
import com.pos.ai.service.support.AnalyticsPeriodSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.pos.ai.service.support.AnalyticsPeriodSupport.period;

@Component
@RequiredArgsConstructor
public class AnalyticsInventoryTools {

    private final ReportingStockReportClient reportingStockReportClient;
    private final ReportingShiftReportClient reportingShiftReportClient;
    private final AiAssistantParallel parallel;

    public Map<String, Object> zReportsOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 90);
        ShiftOverviewResponse overview = reportingShiftReportClient.overview(range.from(), range.to(), 15);

        Map<String, Object> out = AiAnalyticsMaps.create();
        out.put("from", range.from().toString());
        out.put("to", range.to().toString());
        out.put("periodCount", overview.periodCount());
        out.put("periodTotalAmount", overview.periodTotalAmount());
        out.put("totalInSystem", overview.totalInSystem());
        out.put("recentReports", overview.recentReports().stream().map(this::toZReportRow).toList());
        return out;
    }

    public Map<String, Object> inventoryOverview(LocalDate from, LocalDate to, Integer companyId) {
        AnalyticsPeriodSupport.Period range = period(from, to, 30);

        CompletableFuture<InventorySlice> inventoryF = parallel.supply(
            () -> loadInventorySlice(range.from(), range.to())
        );
        CompletableFuture<LowStockSlice> lowStockF = parallel.supply(
            this::loadLowStockSlice
        );
        AiAssistantParallel.awaitAll(inventoryF, lowStockF);

        InventorySlice inventorySlice = inventoryF.join();
        LowStockSlice lowStockSlice = lowStockF.join();

        return Map.of(
            "from", range.from().toString(),
            "to", range.to().toString(),
            "inventoriesCount", inventorySlice.count(),
            "recentInventories", inventorySlice.recent(),
            "lowStockCount", lowStockSlice.count(),
            "lowStockProducts", lowStockSlice.rows()
        );
    }

    private InventorySlice loadInventorySlice(LocalDate from, LocalDate to) {
        var page = reportingStockReportClient.inventories(from, to, null, 0, 10);
        List<Map<String, Object>> recent = page.content().stream()
            .map(inventory -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("inventoryNumber", inventory.inventoryNumber());
                row.put("storeName", inventory.storeName() != null ? inventory.storeName() : "—");
                row.put("status", inventory.status());
                row.put("totalLines", inventory.totalLines());
                row.put("totalDifference", inventory.totalDifference());
                row.put("createdAt", inventory.createdAt() != null ? inventory.createdAt().toString() : "—");
                return row;
            })
            .toList();
        return new InventorySlice(page.totalElements(), recent);
    }

    private LowStockSlice loadLowStockSlice() {
        var page = reportingStockReportClient.lowStock(0, 15);
        List<Map<String, Object>> rows = page.content().stream()
            .map(product -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("productName", product.productName());
                row.put("stockQty", product.stockQuantity());
                row.put("lowStockAlert", product.lowStockAlert());
                return row;
            })
            .toList();
        return new LowStockSlice(page.totalElements(), rows);
    }

    private Map<String, Object> toZReportRow(ShiftReportRowResponse shift) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("zNumber", shift.zNumber() != null ? shift.zNumber() : "—");
        row.put("storeName", shift.storeName() != null ? shift.storeName() : "—");
        row.put("closedAt", shift.closedAt() != null ? shift.closedAt().toString() : "—");
        row.put("totalAmount", AiAnalyticsMaps.money(shift.totalAmount()));
        row.put("salesCount", shift.salesCount() != null ? shift.salesCount() : 0);
        row.put("employeeName", shift.employeeName() != null ? shift.employeeName() : "—");
        return row;
    }

    private record InventorySlice(long count, List<Map<String, Object>> recent) {
    }

    private record LowStockSlice(long count, List<Map<String, Object>> rows) {
    }
}
