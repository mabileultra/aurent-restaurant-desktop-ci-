package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxSpreadsheetHeaderJoinerTest {

    @Test
    void joinsWrapLineIntoTitleAndKeepsIndexRow() {
        List<List<String>> grid = List.of(
            List.of("Hisob-faktura IS-00008429"),
            List.of(
                "№ Маҳсулот номи (хизматлар)", "Маркировка", "Товар идентификация",
                "Штрих коди", "Миқдор", "Нарх"
            ),
            List.of("", "коди", "коди", "", "", ""),
            List.of("1", "2", "3", "4", "5", "6"),
            List.of("1 Трусы", "Маркировкаланган", "06111001017000000", "4602884018285", "10", "8837.50")
        );
        List<List<String>> joined = DidoxSpreadsheetHeaderJoiner.apply(grid);
        assertEquals(4, joined.size());
        assertEquals("Маркировка коди", joined.get(1).get(1));
        assertEquals("Товар идентификация коди", joined.get(1).get(2));
        assertTrue(InvoiceGridRowKinds.numericIndexRow(joined.get(2)));
        assertEquals("1 Трусы", joined.get(3).get(0));
    }

    @Test
    void doesNotJoinProductRows() {
        List<List<String>> grid = List.of(
            List.of("№ Маҳсулот номи", "Идентификация коди", "Нарх"),
            List.of("1 Трусы", "06111001017000000", "100"),
            List.of("2 Носки", "06111001017000001", "80")
        );
        List<List<String>> joined = DidoxSpreadsheetHeaderJoiner.apply(grid);
        assertEquals(3, joined.size());
        assertEquals("1 Трусы", joined.get(1).get(0));
        assertFalse(joined.get(0).get(0).contains("Трусы"));
    }
}
