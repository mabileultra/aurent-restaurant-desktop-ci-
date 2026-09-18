package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PdfMoneyRunSplitterTest {

    @Test
    void splitsGluedDeliveryVatAndAmount() {
        PdfTextRun glued = new PdfTextRun(1, 100f, 400f, 10f, "259 678.05 12% 31 033.91");
        List<PdfTextRun> parts = PdfMoneyRunSplitter.split(glued);
        assertEquals(3, parts.size(), parts.toString());
        assertEquals("259 678.05", parts.get(0).text());
        assertEquals("12%", parts.get(1).text());
        assertEquals("31 033.91", parts.get(2).text());
        assertTrue(parts.get(0).x1() <= parts.get(1).x0() + 0.01f);
        assertTrue(parts.get(1).x1() <= parts.get(2).x0() + 0.01f);
    }

    @Test
    void leavesSingleAmountUntouched() {
        PdfTextRun one = new PdfTextRun(1, 10f, 40f, 10f, "10.00000");
        List<PdfTextRun> parts = PdfMoneyRunSplitter.split(one);
        assertEquals(1, parts.size());
        assertEquals("10.00000", parts.get(0).text());
        assertEquals(10f, parts.get(0).x0());
        assertEquals(40f, parts.get(0).x1());
    }
}
