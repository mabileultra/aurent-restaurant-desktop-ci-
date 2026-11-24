package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UzInvoiceContractNumberExtractorTest {

    @Test
    void extractsSonliShartnoma() {
        assertEquals(
            "481",
            UzInvoiceContractNumberExtractor.extractFromPlainText(
                "14.01.2026 даги 481-сонли шартномага"
            )
        );
    }

    @Test
    void ignoresInvoiceSonliWithoutContractWord() {
        assertNull(
            UzInvoiceContractNumberExtractor.extractFromPlainText("23.05.2026 даги 2683-сонли")
        );
    }

    @Test
    void extractsFromGridPreferringContractCell() {
        List<List<String>> grid = new ArrayList<>();
        grid.add(Arrays.asList("23.05.2026 даги 2683-сонли", "", ""));
        grid.add(Arrays.asList("14.01.2026 даги 481-сонли шартномага", "", ""));
        assertEquals("481", UzInvoiceContractNumberExtractor.extractFromGrid(grid));
    }
}
