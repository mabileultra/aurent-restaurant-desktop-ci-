package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Полная шапка Didox/soliq: все колонки → правильные поля POS (не путать сумму/Нарх/ставку).
 */
class UzInvoiceFullColumnMappingTest {

    private final UzInvoiceSpreadsheetParser parser = new UzInvoiceSpreadsheetParser();

    @Test
    void mapsEveryProductColumnFromFullUzHeader() {
        List<List<String>> grid = List.of(
            List.of("Ҳисоб-фактура", "9912"),
            List.of(
                "№",
                "Маҳсулот номи",
                "Идентификация коди (ИКПУ)",
                "Штрих коди",
                "Ўлчов бирлиги",
                "Миқдор",
                "Нарх",
                "Етказиб бериш қиймати",
                "ҚҚС ставка",
                "ҚҚС сумма",
                "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати",
                "Товарни келиб чиқиши"
            ),
            List.of(
                "1",
                "Фисташки фасовка",
                "02202001001000000",
                "4780012345678",
                "шт",
                "10",
                "8,000.00",
                "80,000.00",
                "12%",
                "9,600.00",
                "89,600.00",
                "Олди-сотди"
            )
        );

        List<Map<String, String>> rows = parser.parseFromGrid(grid);
        assertEquals(1, rows.size());
        Map<String, String> row = rows.get(0);

        assertEquals("Фисташки фасовка", row.get("name"));
        assertEquals("02202001001000000", row.get("ikpu"));
        assertEquals("4780012345678", row.get("barcode"));
        assertEquals("шт", row.get("unit_of_measure"));
        assertEquals("10", row.get("stock_quantity"));
        // 89600 / 10 = 8960 (цена с НДС), не 8000/10=800
        assertEquals("8960.00", row.get("selling_price"));
        assertEquals("8960.00", row.get("cost_price"));
        assertEquals("12.00", row.get("tax_rate_percent_nds"));
        assertFalse(row.getOrDefault("sku", "").isBlank());
    }

    @Test
    void doesNotTreatVatSumColumnAsVatRate() {
        assertFalse(UzInvoiceColumnMapper.isVatRateHeader("ққс сумма"));
        assertFalse(UzInvoiceColumnMapper.isVatRateHeader("сумма ндс"));
    }

    @Test
    void whenLineTotalEqualsNarxKeepsUnitPrice() {
        List<List<String>> grid = List.of(
            List.of(
                "№", "Маҳсулот номи", "ИКПУ", "Ўлчов бирлиги", "Миқдор", "Нарх",
                "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати", "ҚҚС ставка"
            ),
            List.of(
                "1", "Товар", "02202001001000000", "шт", "10", "8000",
                "8000", "0"
            )
        );
        Map<String, String> row = parser.parseFromGrid(grid).get(0);
        assertEquals("10", row.get("stock_quantity"));
        assertEquals("8000.00", row.get("selling_price"));
    }
}
