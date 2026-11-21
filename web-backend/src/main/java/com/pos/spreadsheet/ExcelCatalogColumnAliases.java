package com.pos.spreadsheet;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Синонимы заголовков Excel → ключи шаблона {@link ExcelTemplate#PRODUCTS_CATALOG}.
 */
public final class ExcelCatalogColumnAliases {

    private ExcelCatalogColumnAliases() {
    }

    public static List<String> aliasesFor(String key) {
        return switch (key) {
            case "sku" -> List.of(
                "sku", "артикул", "артикул (sku)", "артикул (sku) *", "код", "code", "product_code", "артикул товара"
            );
            case "name" -> List.of(
                "name", "наименование", "наименование *", "название", "товар", "product", "mahsulot",
                "маҳсулот номи", "mahsulot nomi", "наименование товара"
            );
            case "category" -> List.of("category", "категория", "group", "группа");
            case "selling_price" -> List.of(
                "selling_price", "цена продажи", "цена", "price", "розничная цена", "retail_price", "narx"
            );
            case "cost_price" -> List.of(
                "cost_price", "себестоимость", "закуп", "закупочная цена", "cost", "purchase_price"
            );
            case "tax_rate_percent_nds" -> List.of(
                "tax_rate_percent_nds", "ндс %", "ндс", "vat", "qqs", "ққс", "ставка ндс", "vat %"
            );
            case "ikpu" -> List.of("ikpu", "икпу", "mxik", "каталог", "икпу код");
            case "unit_of_measure" -> List.of(
                "unit_of_measure", "ед. изм.", "ед.", "единица", "uom", "unit", "ўлчов", "бирлиги"
            );
            case "barcode" -> List.of("barcode", "штрихкод", "штрих код", "ean", "shtrix");
            case "storage_location" -> List.of(
                "storage_location", "расположение", "полка", "location", "зона"
            );
            case "stock_quantity" -> List.of(
                "stock_quantity", "остаток", "кол-во", "количество", "qty", "quantity", "миқдор", "stock"
            );
            case "active" -> List.of("active", "активен", "активен (1/0)", "status", "статус");
            default -> List.of(key);
        };
    }

    /** Подсказка: наш ключ → точный заголовок из файла. */
    public static Map<String, String> suggest(List<String> fileHeaders, ExcelTemplate template) {
        Map<String, String> out = new LinkedHashMap<>();
        if (fileHeaders == null || template == null) {
            return out;
        }
        List<String> unused = new ArrayList<>(fileHeaders);
        for (ExcelColumn col : template.columns()) {
            String match = findBest(unused, col);
            if (match != null) {
                out.put(col.key(), match);
                unused.remove(match);
            }
        }
        return out;
    }

    private static String findBest(List<String> headers, ExcelColumn col) {
        String expectedNorm = ExcelSpreadsheetReader.normHeader(col.header());
        String keyNorm = ExcelSpreadsheetReader.normHeader(col.key());
        for (String h : headers) {
            if (!StringUtils.hasText(h)) {
                continue;
            }
            String n = ExcelSpreadsheetReader.normHeader(h);
            if (n.equals(expectedNorm) || n.equals(keyNorm)) {
                return h;
            }
        }
        for (String alias : aliasesFor(col.key())) {
            String a = ExcelSpreadsheetReader.normHeader(alias);
            for (String h : headers) {
                if (!StringUtils.hasText(h)) {
                    continue;
                }
                String n = ExcelSpreadsheetReader.normHeader(h);
                if (aliasMatches(n, a)) {
                    return h;
                }
            }
        }
        return null;
    }

    /**
     * Exact always; substring only for longer aliases so short ones
     * ({@code code}, {@code цена}) do not steal {@code Barcode} / {@code Цена закупки}.
     */
    static boolean aliasMatches(String headerNorm, String aliasNorm) {
        if (!StringUtils.hasText(headerNorm) || !StringUtils.hasText(aliasNorm)) {
            return false;
        }
        if (headerNorm.equals(aliasNorm)) {
            return true;
        }
        if (aliasNorm.length() < 5) {
            return false;
        }
        return headerNorm.contains(aliasNorm) || aliasNorm.contains(headerNorm);
    }

    public static String normalizeLabel(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
    }
}
