package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UzInvoiceInvoiceDateExtractorTest {

    @Test
    void extractsDateBeforeDagiSonli() {
        assertEquals(
            "2026-05-23",
            UzInvoiceInvoiceDateExtractor.extractFromPlainText("23.05.2026 даги 2683-сонли")
        );
    }

    @Test
    void extractsFromGridHeader() {
        List<List<String>> grid = List.of(
            List.of("14.01.2026 даги 481-сонли шартномага"),
            List.of("23.05.2026 даги 2683-сонли"),
            List.of("Маҳсулот номи", "Нарх")
        );
        assertEquals("2026-05-23", UzInvoiceInvoiceDateExtractor.extractFromGrid(grid));
    }

    @Test
    void ignoresPlainNumberWithoutDate() {
        assertNull(UzInvoiceInvoiceDateExtractor.extractFromPlainText("просто текст без даты"));
    }
}
