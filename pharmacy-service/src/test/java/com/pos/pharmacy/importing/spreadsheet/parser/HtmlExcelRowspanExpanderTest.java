package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HtmlExcelRowspanExpanderTest {

    @Test
    void repeatsVerticalHeaderIntoNextRow() {
        List<List<HtmlExcelCell>> source = List.of(
            List.of(new HtmlExcelCell("Маҳсулот", 1, 2), new HtmlExcelCell("Идентификация", 1, 1)),
            List.of(new HtmlExcelCell("коди", 1, 1))
        );
        List<List<String>> grid = HtmlExcelRowspanExpander.expand(source);
        assertEquals(List.of("Маҳсулот", "Идентификация"), grid.get(0));
        assertEquals(List.of("Маҳсулот", "коди"), grid.get(1));
    }

    @Test
    void repeatsRowspanAcrossColspan() {
        List<List<HtmlExcelCell>> source = List.of(
            List.of(new HtmlExcelCell("A", 1, 1), new HtmlExcelCell("B", 2, 2)),
            List.of(new HtmlExcelCell("C", 1, 1))
        );
        List<List<String>> grid = HtmlExcelRowspanExpander.expand(source);
        assertEquals(List.of("A", "B", ""), grid.get(0));
        assertEquals(List.of("C", "B", ""), grid.get(1));
    }
}
