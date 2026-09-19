package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PdfOriginRunSplitterTest {

    @Test
    void splitsMoneyFromOldiSotdi() {
        PdfTextRun run = new PdfTextRun(1, 100f, 220f, 10f, "98 980.00 Олди-сотди");
        List<PdfTextRun> parts = PdfOriginRunSplitter.split(run);
        assertEquals(2, parts.size(), parts.toString());
        assertEquals("98 980.00", parts.get(0).text());
        assertEquals("Олди-сотди", parts.get(1).text());
    }
}
