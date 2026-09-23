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
}
