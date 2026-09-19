package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfBarcodeRunSplitterTest {

    @Test
    void peelsEan13FromCatalogTail() {
        PdfTextRun run = new PdfTextRun(
            1, 140f, 302f, 10f,
            "M01AB55 КЮПЕН (Avison Pharmaceuticals Pvt 8908018944007"
        );
        List<PdfTextRun> parts = PdfBarcodeRunSplitter.split(run);
        assertEquals(2, parts.size(), parts.toString());
        assertEquals("M01AB55 КЮПЕН (Avison Pharmaceuticals Pvt", parts.get(0).text());
        assertEquals("8908018944007", parts.get(1).text());
        assertTrue(parts.get(1).x0() > parts.get(0).x0());
    }

    @Test
    void leavesMxikAlone() {
        PdfTextRun mxik = new PdfTextRun(1, 10f, 80f, 10f, "03004409005039001");
        assertEquals(List.of(mxik), PdfBarcodeRunSplitter.split(mxik));
    }
}
