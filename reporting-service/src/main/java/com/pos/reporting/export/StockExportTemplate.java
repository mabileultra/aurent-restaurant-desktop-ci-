package com.pos.reporting.export;

import java.util.List;

public enum StockExportTemplate implements ExcelSheetTemplate {

    STOCK_BALANCES(
        "Остатки",
        List.of(
            col("product_name", "Товар"),
            col("sku", "Артикул"),
            col("barcode", "Штрихкод"),
            col("category", "Категория"),
            col("stock_qty", "Остаток"),
            col("min_qty", "Минимум"),
            col("cost_price", "Себестоимость"),
            col("stock_value", "Сумма остатка")
        )
    ),

    DEAD_STOCK(
        "Залежалые",
        List.of(
            col("product_name", "Товар"),
            col("sku", "Артикул"),
            col("barcode", "Штрихкод"),
            col("category", "Категория"),
            col("stock_qty", "Остаток"),
            col("stock_value", "Сумма остатка"),
            col("last_sale_date", "Последняя продажа"),
            col("days_idle", "Дней без продаж")
        )
    ),

    STOCK_ADJUSTMENTS(
        "Корректировки",
        List.of(
            col("created_at", "Дата"),
            col("product_name", "Товар"),
            col("sku", "Артикул"),
            col("quantity", "Кол-во"),
            col("store", "Магазин"),
            col("user", "Кто оформил"),
            col("notes", "Комментарий"),
            col("doc_no", "Документ")
        )
    ),

    STOCK_INVENTORIES(
        "Инвентаризация",
        List.of(
            col("inventory_no", "№ акта"),
            col("created_at", "Дата"),
            col("store", "Магазин"),
            col("lines", "Строк"),
            col("diff_sum", "Σ |расх.|"),
            col("user", "Кто оформил"),
            col("notes", "Комментарий")
        )
    ),

    STOCK_TRANSFERS(
        "Перемещения",
        List.of(
            col("transfer_no", "№"),
            col("created_at", "Дата"),
            col("from_store", "Откуда"),
            col("to_store", "Куда"),
            col("total_qty", "Кол-во"),
            col("user", "Кто оформил"),
            col("notes", "Комментарий")
        )
    );

    private final String sheetName;
    private final List<ExcelColumn> columns;

    StockExportTemplate(String sheetName, List<ExcelColumn> columns) {
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
