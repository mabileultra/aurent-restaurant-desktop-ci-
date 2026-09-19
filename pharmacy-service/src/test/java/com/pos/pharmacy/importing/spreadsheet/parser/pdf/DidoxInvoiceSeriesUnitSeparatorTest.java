package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxInvoiceSeriesUnitSeparatorTest {

    @Test
    void movesUnitRemainderOutOfSeriesColumn() {
        List<String> header = List.of(
            "Маҳсулот", "MXIK", "Штрих", "Усул", "Серия", "Ўлчов бирлиги", "Нарх"
        );
        List<List<String>> rows = List.of(
            List.of("1 Кюпен", "03004", "8908", "Рецептли",
                "UQT24112 dona (tabletka) qadoq=10 blister", "", "51723.21"),
            List.of("2 Ника", "03004", "4780", "Рецептли",
                "qadoq=10 blister * 10 660425 dona", "", "61556.63")
        );
        List<List<String>> out = DidoxInvoiceSeriesUnitSeparator.apply(header, rows);
        assertEquals("UQT24112", out.get(0).get(4));
        assertEquals("dona (tabletka) qadoq=10 blister", out.get(0).get(5));
        assertEquals("660425", out.get(1).get(4));
        assertEquals("qadoq=10 blister * 10 dona", out.get(1).get(5));
    }

    @Test
    void keepsExistingUnitCell() {
        List<String> header = List.of("Серия", "Ўлчов");
        List<List<String>> rows = List.of(
            List.of("01", "dona")
        );
        List<List<String>> out = DidoxInvoiceSeriesUnitSeparator.apply(header, rows);
        assertEquals("01", out.get(0).get(0));
        assertEquals("dona", out.get(0).get(1));
    }
}
