package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PdfIkpuRunSplitterTest {

    @Test
    void splitsFlagFromMxik() {
        PdfTextRun run = new PdfTextRun(1, 10f, 200f, 10f, "Маркировкаланган 030040170018002 - Папаверин");
        List<PdfTextRun> parts = PdfIkpuRunSplitter.split(run);
        assertEquals(2, parts.size(), parts.toString());
        assertEquals("Маркировкаланган", parts.get(0).text());
        assertEquals("030040170018002 - Папаверин", parts.get(1).text());
    }

    @Test
    void splitsTwoMxikCodes() {
        PdfTextRun run = new PdfTextRun(
            1, 10f, 300f, 10f,
            "06111001017000000 - Трусы для детей 030040170018002 - Папаверин"
        );
        List<PdfTextRun> parts = PdfIkpuRunSplitter.split(run);
        assertEquals(2, parts.size(), parts.toString());
        assertEquals("06111001017000000 - Трусы для детей", parts.get(0).text());
        assertEquals("030040170018002 - Папаверин", parts.get(1).text());
    }
}
