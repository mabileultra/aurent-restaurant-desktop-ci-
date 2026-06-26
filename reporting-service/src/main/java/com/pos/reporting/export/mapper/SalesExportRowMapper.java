package com.pos.reporting.export.mapper;

import com.pos.reporting.dto.CashierStatResponse;
import com.pos.reporting.dto.CategorySalesRowResponse;
import com.pos.reporting.dto.DailySummaryResponse;
import com.pos.reporting.dto.PeriodCompareResponse;
import com.pos.reporting.dto.ProductSalesRowResponse;
import com.pos.reporting.dto.StoreSalesRowResponse;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SalesExportRowMapper {

    public List<Map<String, Object>> productRows(List<ProductSalesRowResponse> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (ProductSalesRowResponse row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("product_name", row.productName());
            mapped.put("sku", row.sku());
            mapped.put("barcode", row.barcode());
            mapped.put("category", row.categoryName());
            mapped.put("sold_qty", row.quantitySold());
            mapped.put("returned_qty", row.quantityReturned());
            mapped.put("net_qty", row.netQuantity());
            mapped.put("revenue", row.revenue());
            mapped.put("cost", row.costEstimate());
            mapped.put("margin", row.margin());
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> categoryRows(List<CategorySalesRowResponse> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (CategorySalesRowResponse row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("category", blank(row.categoryName()));
            mapped.put("receipt_count", row.receiptCount());
            mapped.put("net_qty", row.netQuantity());
            mapped.put("returned_qty", row.quantityReturned());
            mapped.put("revenue", row.revenue());
            mapped.put("cost", row.costEstimate());
            mapped.put("margin", row.margin());
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> storeRows(List<StoreSalesRowResponse> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (StoreSalesRowResponse row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("store", row.storeName());
            mapped.put("receipt_count", row.receiptCount());
            mapped.put("net_qty", row.netQuantity());
            mapped.put("returned_qty", row.quantityReturned());
            mapped.put("revenue", row.revenue());
            mapped.put("cost", row.costEstimate());
            mapped.put("margin", row.margin());
            data.add(mapped);
        }
        return data;
    }

    public List<Map<String, Object>> periodCompareRows(PeriodCompareResponse compare) {
        List<Map<String, Object>> data = new ArrayList<>();

        Map<String, Object> current = new LinkedHashMap<>();
        current.put("period", "Текущий");
        current.put("date_from", compare.currentFrom());
        current.put("date_to", compare.currentTo());
        current.put("revenue", compare.current().revenue());
        current.put("receipt_count", compare.current().receiptCount());
        current.put("items_sold", compare.current().itemsSold());
        current.put("revenue_delta", compare.deltas().revenueDelta());
        current.put("revenue_delta_pct", compare.deltas().revenueDeltaPercent());
        current.put("receipt_delta", compare.deltas().receiptCountDelta());
        current.put("items_delta", compare.deltas().itemsSoldDelta());
        data.add(current);

        Map<String, Object> previous = new LinkedHashMap<>();
        previous.put("period", "Предыдущий");
        previous.put("date_from", compare.previousFrom());
        previous.put("date_to", compare.previousTo());
        previous.put("revenue", compare.previous().revenue());
        previous.put("receipt_count", compare.previous().receiptCount());
        previous.put("items_sold", compare.previous().itemsSold());
        previous.put("revenue_delta", "");
        previous.put("revenue_delta_pct", "");
        previous.put("receipt_delta", "");
        previous.put("items_delta", "");
        data.add(previous);

        return data;
    }

    public List<Map<String, Object>> dailySummaryRow(LocalDate date, DailySummaryResponse summary) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("date", date);
        row.put("revenue", summary.totalRevenue());
        row.put("receipt_count", summary.transactionCount());
        row.put("items_sold", summary.itemsSold());
        row.put("cost_estimate", summary.totalCostEstimate());
        row.put("gross_profit", summary.grossProfit());
        return List.of(row);
    }

    public List<Map<String, Object>> cashierRows(List<CashierStatResponse> rows) {
        List<Map<String, Object>> data = new ArrayList<>();
        for (CashierStatResponse row : rows) {
            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("cashier", row.cashierName());
            mapped.put("revenue", row.revenue());
            data.add(mapped);
        }
        return data;
    }

    private static String blank(String value) {
        return value != null ? value : "";
    }
}
