package com.pos.reporting.export;

import java.util.List;

public enum SalesExportTemplate implements ExcelSheetTemplate {

    SALES_BY_PRODUCTS(
        "Продажи по товарам",
        List.of(
            col("product_name", "Товар"),
            col("sku", "Артикул"),
            col("barcode", "Штрихкод"),
            col("category", "Категория"),
            col("sold_qty", "Продано"),
            col("returned_qty", "Возврат"),
            col("net_qty", "Нетто"),
            col("revenue", "Выручка"),
            col("cost", "Себестоимость"),
            col("margin", "Маржа")
        )
    ),

    SALES_BY_CATEGORIES(
        "Продажи по категориям",
        List.of(
            col("category", "Категория"),
            col("receipt_count", "Чеков"),
            col("net_qty", "Нетто, шт."),
            col("returned_qty", "Возврат, шт."),
            col("revenue", "Выручка"),
            col("cost", "Себестоимость"),
            col("margin", "Маржа")
        )
    ),

    SALES_BY_STORES(
        "Продажи по магазинам",
        List.of(
            col("store", "Магазин"),
            col("receipt_count", "Чеков"),
            col("net_qty", "Нетто, шт."),
            col("returned_qty", "Возврат, шт."),
            col("revenue", "Выручка"),
            col("cost", "Себестоимость"),
            col("margin", "Маржа")
        )
    ),

    PERIOD_COMPARE(
        "Сравнение периодов",
        List.of(
            col("period", "Период"),
            col("date_from", "С"),
            col("date_to", "По"),
            col("revenue", "Выручка"),
            col("receipt_count", "Чеков"),
            col("items_sold", "Продано, шт."),
            col("revenue_delta", "Δ выручка"),
            col("revenue_delta_pct", "Δ выручка %"),
            col("receipt_delta", "Δ чеков"),
            col("items_delta", "Δ штук")
        )
    ),

    DAILY_SUMMARY(
        "Сводка за день",
        List.of(
            col("date", "Дата"),
            col("revenue", "Выручка"),
            col("receipt_count", "Чеков"),
            col("items_sold", "Продано, шт."),
            col("cost_estimate", "Себестоимость"),
            col("gross_profit", "Валовая прибыль")
        )
    ),

    CASHIER_PERFORMANCE(
        "Кассиры",
        List.of(
            col("cashier", "Кассир"),
            col("revenue", "Выручка")
        )
    );

    private final String sheetName;
    private final List<ExcelColumn> columns;

    SalesExportTemplate(String sheetName, List<ExcelColumn> columns) {
        this.sheetName = sheetName;
        this.columns = columns;
    }

    public String sheetName() {
        return sheetName;
    }

    public List<ExcelColumn> columns() {
        return columns;
    }

    private static ExcelColumn col(String key, String header) {
        return new ExcelColumn(key, header);
    }
}
