package com.pos.reporting.export;

import java.util.List;

public enum PlatformAnalyticsExportTemplate implements ExcelSheetTemplate {
    STORES("Stores", List.of(
        col("name", "Store"),
        col("turnover", "Turnover"),
        col("profit", "Profit"),
        col("receipts", "Receipts"),
        col("avgCheck", "Avg check"),
        col("growthPct", "Growth %")
    )),
    PRODUCTS("Products", List.of(
        col("name", "Product"),
        col("qty", "Qty"),
        col("revenue", "Revenue"),
        col("cost", "Cost"),
        col("profit", "Profit"),
        col("marginPct", "Margin %"),
        col("growthPct", "Growth %")
    )),
    SALES_DAILY("Sales daily", List.of(
        col("date", "Date"),
        col("turnover", "Turnover"),
        col("profit", "Profit"),
        col("receipts", "Receipts"),
        col("avgCheck", "Avg check")
    )),
    PAYMENTS("Payments", List.of(
        col("id", "Method"),
        col("amount", "Amount"),
        col("receipts", "Receipts"),
        col("sharePct", "Share %")
    )),
    FISCAL_STORES("Fiscal by store", List.of(
        col("name", "Store"),
        col("turnover", "Turnover"),
        col("receipts", "Receipts"),
        col("returnsAmount", "Returns"),
        col("cancelledReceipts", "Cancelled")
    )),
    OVERVIEW_KPI("Overview KPI", List.of(
        col("metric", "Metric"),
        col("value", "Value"),
        col("deltaPct", "Delta %")
    ));

    private final String sheetName;
    private final List<ExcelColumn> columns;

    PlatformAnalyticsExportTemplate(String sheetName, List<ExcelColumn> columns) {
        this.sheetName = sheetName;
        this.columns = columns;
    }

    @Override
    public String sheetName() {
        return sheetName;
    }

    @Override
    public List<ExcelColumn> columns() {
        return columns;
    }

    private static ExcelColumn col(String key, String header) {
        return new ExcelColumn(key, header);
    }
}
