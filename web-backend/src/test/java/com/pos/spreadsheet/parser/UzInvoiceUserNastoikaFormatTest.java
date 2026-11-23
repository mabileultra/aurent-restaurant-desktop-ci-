package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Реальный формат Soliq/Didox с «Маркировка коди» и qty 288.000000. */
class UzInvoiceUserNastoikaFormatTest {

    private final UzInvoiceSpreadsheetParser parser = new UzInvoiceSpreadsheetParser();

    @Test
    void mapsMarkirovkaShiftedColumnsToQtyAndVatPrice() {
        List<List<String>> grid = List.of(
            List.of("Ҳисоб-фактура", "Хавф даражаси: ПАСТ"),
            List.of(
                "№",
                "Маҳсулот номи (хизматлар)",
                "Маркировка коди",
                "Товар (хизмат) лар Ягона электрон миллий каталоги бўйича идентификация коди ва номи",
                "Товар/хизмат штрих коди",
                "Ўлчов бирлиги",
                "Миқдор",
                "Нарҳ",
                "Етказиб бериш қиймати",
                "ҚҚС ставка",
                "ҚҚС сумма",
                "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати",
                "Товарни келиб чиқиши"
            ),
            List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"),
            List.of(
                "1",
                "Настойка горькая FAROVON O'ZBEKONA 34,40% 0.1л",
                "Маркировкаланган",
                "02208013001021036 - Горькая настойка FAROVON O'ZBEKONA крепость 34,4% стакан 0,1 л",
                "4780114363296",
                "шт. (стакан) 0.10 литр",
                "288.000000",
                "7 142.86",
                "2 057 142.86",
                "12%",
                "246 857.14",
                "2 304 000.00",
                "Олди-сотди"
            ),
            List.of(
                "2",
                "НАСТОЙКА ГОРЬКАЯ GLORIA, 40%, 0.1Л",
                "Маркировкаланган",
                "02208013001025003 - Горькая настойка GLORIA крепость 40% стеклянная бутылка 0,1 л",
                "4780010736545",
                "шт. (бутылка) 0.10 литр",
                "144.000000",
                "8 035.71",
                "1 157 142.86",
                "12%",
                "138 857.14",
                "1 296 000.00",
                "Олди-сотди"
            )
        );

        List<Map<String, String>> rows = parser.parseFromGrid(grid);
        assertEquals(2, rows.size());

        Map<String, String> farovon = rows.get(0);
        assertTrue(farovon.get("name").contains("FAROVON"), farovon.get("name"));
        assertEquals("02208013001021036", farovon.get("ikpu"));
        assertEquals("4780114363296", farovon.get("barcode"));
        assertEquals("288.000000", farovon.get("stock_quantity"));
        // Цена из файла = колонка «…ҚҚСни ҳисобга олган…» / Миқдор
        // 2 304 000 / 288 = 8000 (не «Нарҳ» 7 142.86 без НДС)
        assertEquals("8000.00", farovon.get("selling_price"));
        assertEquals("8000.00", farovon.get("cost_price"));

        Map<String, String> gloria = rows.get(1);
        assertTrue(gloria.get("name").toUpperCase().contains("GLORIA"), gloria.get("name"));
        assertEquals("02208013001025003", gloria.get("ikpu"));
        assertEquals("4780010736545", gloria.get("barcode"));
        assertEquals("144.000000", gloria.get("stock_quantity"));
        // 1296000 / 144 = 9000
        assertEquals("9000.00", gloria.get("selling_price"));
        assertEquals("12.00", farovon.get("tax_rate_percent_nds"));
        assertEquals("12.00", gloria.get("tax_rate_percent_nds"));
    }

    @Test
    void mapsWhenQqsSplitIntoStavkaSummaSubHeader() {
        // Как в Soliq-таблице: «ҚҚС» + вторая строка «Ставка | Сумма» + индекс 1..12
        List<List<String>> grid = List.of(
            List.of("Хавф даражаси: ПАСТ"),
            List.of(
                "№",
                "Маҳсулот номи (хизматлар)",
                "Маркировка коди",
                "Товар (хизмат) лар Ягона электрон миллий каталоги бўйича идентификация коди ва номи",
                "Товар/хизмат штрих коди",
                "Ўлчов бирлиги",
                "Миқдор",
                "Нарҳ",
                "Етказиб бериш қиймати",
                "ҚҚС",
                "",
                "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати",
                "Товарни келиб чиқиши"
            ),
            List.of("", "", "", "", "", "", "", "", "", "Ставка", "Сумма", "", ""),
            List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"),
            List.of(
                "1",
                "Настойка горькая FAROVON O'ZBEKONA 34,40% 0.1л",
                "Маркировкаланган",
                "02208013001021036 - Горькая настойка FAROVON",
                "4780114363296",
                "шт. (стакан) 0.10 литр",
                "288.000000",
                "7 142.86",
                "2 057 142.86",
                "12%",
                "246 857.14",
                "2 304 000.00",
                "Олди-сотди"
            )
        );
        Map<String, String> row = parser.parseFromGrid(grid).get(0);
        assertEquals("288.000000", row.get("stock_quantity"));
        assertEquals("8000.00", row.get("selling_price"));
        assertEquals("4780114363296", row.get("barcode"));
        assertEquals("02208013001021036", row.get("ikpu"));
    }

    @Test
    void threeDecimalQtyDoesNotBecomeThousands() {
        List<List<String>> grid = List.of(
            List.of(
                "№", "Маҳсулот номи", "Маркировка коди", "ИКПУ", "Штрих коди",
                "Ўлчов бирлиги", "Миқдор", "Нарҳ",
                "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати", "ҚҚС ставка"
            ),
            List.of(
                "1", "Водка", "Маркировкаланган", "02208001002156003", "4780011111111",
                "шт", "6000.000", "10.00", "60 000.00", "12%"
            )
        );
        Map<String, String> row = parser.parseFromGrid(grid).get(0);
        assertEquals("6000.000", row.get("stock_quantity"));
        // 60000 / 6000 = 10 — not 60000/6000000 = 0.01
        assertEquals("10.00", row.get("selling_price"));
    }
}
