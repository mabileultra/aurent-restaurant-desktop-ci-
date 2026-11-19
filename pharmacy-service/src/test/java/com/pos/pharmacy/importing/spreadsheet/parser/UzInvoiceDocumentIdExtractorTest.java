package com.pos.pharmacy.importing.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UzInvoiceDocumentIdExtractorTest {

    @Test
    void matchesIsStyleInUzHeaderSentence() {
        assertEquals(
            "IS-00008429",
            UzInvoiceDocumentIdExtractor.extractFromPlainText("13.04.2024 даги IS-00008429-сонли")
        );
    }

    @Test
    void ignoresClientCodeCli() {
        assertNull(UzInvoiceDocumentIdExtractor.extractFromPlainText("Покупатель CLI-12937 договор 41 20"));
        assertNull(UzInvoiceDocumentIdExtractor.extractFromPlainText("CLI-12937"));
    }

    @Test
    void prefersIsOverCliInSameGrid() {
        List<List<String>> grid = new ArrayList<>();
        grid.add(Arrays.asList("Клиент CLI-12937", "", ""));
        grid.add(Arrays.asList("13.04.2024 даги IS-00008429-сонли", "", ""));
        assertEquals("IS-00008429", UzInvoiceDocumentIdExtractor.extractFromGrid(grid));
    }

    @Test
    void normalizesCompactIsWithoutHyphen() {
        assertEquals("IS-00008429", UzInvoiceDocumentIdExtractor.extractFromPlainText("№ IS00008429 дата"));
    }

    @Test
    void matchesNumericSonliInvoiceNumber() {
        assertEquals(
            "2683",
            UzInvoiceDocumentIdExtractor.extractFromPlainText("23.05.2026 даги 2683-сонли")
        );
    }

    @Test
    void ignoresSonliContractShartnoma() {
        assertNull(
            UzInvoiceDocumentIdExtractor.extractFromPlainText(
                "14.01.2026 даги 481-сонли шартномага"
            )
        );
    }

    @Test
    void prefersInvoiceSonliOverContractInGrid() {
        List<List<String>> grid = new ArrayList<>();
        grid.add(Arrays.asList("14.01.2026 даги 481-сонли шартномага", "", ""));
        grid.add(Arrays.asList("23.05.2026 даги 2683-сонли", "", ""));
        assertEquals("2683", UzInvoiceDocumentIdExtractor.extractFromGrid(grid));
    }

    @Test
    void doesNotMatchBareDidoxPortalId() {
        assertNull(UzInvoiceDocumentIdExtractor.extractFromPlainText("2031222256"));
    }
}
