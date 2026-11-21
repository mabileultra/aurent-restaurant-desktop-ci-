package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UzInvoiceSpreadsheetParserVatPriceTest {

    private final UzInvoiceSpreadsheetParser parser = new UzInvoiceSpreadsheetParser();

    @Test
    void usesDeliveryValueWithVatAndVatRateFromInvoiceGrid() {
        List<List<String>> grid = List.of(
            List.of("Ҳисоб-фактура", "2583"),
            List.of(
                "№",
                "Маҳсулот номи",
                "Каталог",
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
                "Vodka PULSAR 0.5",
                "02202001001000000",
                "4780112345678",
                "шт",
                "75",
                "28571.43",
                "2142857.14",
                "12%",
                "257142.86",
                "2400000.00",
                "Олди-сотди"
            )
        );

        List<Map<String, String>> rows = parser.parseFromGrid(grid);
        assertEquals(1, rows.size());
        Map<String, String> row = rows.get(0);
        assertEquals("32000.00", row.get("selling_price"));
        assertEquals("32000.00", row.get("cost_price"));
        assertEquals("12.00", row.get("tax_rate_percent_nds"));
        assertEquals("75", row.get("stock_quantity"));
    }
}
