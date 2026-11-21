package com.pos.spreadsheet;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ExcelCatalogColumnAliasesTest {

    @Test
    void shortAliasCodeDoesNotStealBarcodeHeader() {
        assertFalse(ExcelCatalogColumnAliases.aliasMatches("barcode", "code"));
        assertTrue(ExcelCatalogColumnAliases.aliasMatches("barcode", "barcode"));
    }

    @Test
    void shortAliasTsenaDoesNotStealPurchasePrice() {
        String purchase = ExcelSpreadsheetReader.normHeader("Цена закупки");
        String sellingAlias = ExcelSpreadsheetReader.normHeader("цена");
        assertFalse(ExcelCatalogColumnAliases.aliasMatches(purchase, sellingAlias));
    }

    @Test
    void suggestMapsBarcodeAndCostSeparately() {
        Map<String, String> map = ExcelCatalogColumnAliases.suggest(
            List.of("Штрихкод", "Цена закупки", "Наименование", "Артикул"),
            ExcelTemplate.PRODUCTS_CATALOG
        );
        assertEquals("Артикул", map.get("sku"));
        assertEquals("Штрихкод", map.get("barcode"));
        assertEquals("Цена закупки", map.get("cost_price"));
    }
}
