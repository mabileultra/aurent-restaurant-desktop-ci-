package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PdfBatchUnitRunSplitterTest {

    @Test
    void splitsSeriesFromDonaWrap() {
        assertSplit("ZA4485dona", "ZA4485", "dona");
        assertSplit("010726 do", "010726", "do");
        assertSplit("NE 260306 dona", "NE 260306", "dona");
        assertSplit("DH5511 шт", "DH5511", "шт");
    }

    @Test
    void leavesMoneyAndQtyAlone() {
        PdfTextRun qty = new PdfTextRun(1, 0f, 40f, 10f, "10.00000");
        assertEquals(List.of(qty), PdfBatchUnitRunSplitter.split(qty));
        PdfTextRun money = new PdfTextRun(1, 0f, 40f, 10f, "8837.50");
        assertEquals(List.of(money), PdfBatchUnitRunSplitter.split(money));
        PdfTextRun name = new PdfTextRun(1, 0f, 80f, 10f, "ZA4485 Trusi");
        assertEquals(List.of(name), PdfBatchUnitRunSplitter.split(name));
    }

    private static void assertSplit(String text, String batch, String unit) {
        PdfTextRun run = new PdfTextRun(1, 10f, 80f, 10f, text);
        List<PdfTextRun> parts = PdfBatchUnitRunSplitter.split(run);
        assertEquals(2, parts.size(), parts.toString());
        assertEquals(batch, parts.get(0).text());
        assertEquals(unit, parts.get(1).text());
    }
}
