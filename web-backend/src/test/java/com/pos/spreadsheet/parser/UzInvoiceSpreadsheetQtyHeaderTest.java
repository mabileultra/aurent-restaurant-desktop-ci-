package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UzInvoiceSpreadsheetQtyHeaderTest {

    private final UzInvoiceSpreadsheetParser parser = new UzInvoiceSpreadsheetParser();

    @Test
    void mapsKolVoHeaderToQuantityNotUnitPrice() {
        List<List<String>> grid = List.of(
            List.of("№", "Наименование", "ИКПУ", "Ед.", "Кол-во", "Цена"),
            List.of("1", "Товар А", "02202001001000000", "шт", "12", "45000")
        );

        List<Map<String, String>> rows = parser.parseFromGrid(grid);
        assertEquals(1, rows.size());
        Map<String, String> row = rows.get(0);
        assertEquals("12", row.get("stock_quantity"));
        assertEquals("45000.00", row.get("selling_price"));
    }

    @Test
    void mapsQuantityWordWhenNameHeaderIsUzbek() {
        List<List<String>> grid = List.of(
            List.of("№", "Маҳсулот номи", "ИКПУ", "Ед.", "Quantity", "Нарх"),
            List.of("1", "Item A", "02202001001000000", "шт", "3", "10000")
        );

        List<Map<String, String>> rows = parser.parseFromGrid(grid);
        assertEquals(1, rows.size());
        assertEquals("3", rows.get(0).get("stock_quantity"));
        assertEquals("10000.00", rows.get(0).get("selling_price"));
    }
}
