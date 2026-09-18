package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DidoxInvoiceMoneyColumnAdvanceTest {

    @Test
    void advancesSecondAmountWhenBandsCollide() {
        DidoxInvoiceColumnLayout layout = layout16();
        PdfTextRun first = new PdfTextRun(1, x(11), x(11) + 20f, 10f, "259 678.05");
        PdfTextRun second = new PdfTextRun(1, x(11) + 8f, x(11) + 28f, 10f, "12%");
        int col1 = DidoxInvoiceMoneyColumnAdvance.column(layout, first, -1);
        int col2 = DidoxInvoiceMoneyColumnAdvance.column(layout, second, col1);
        assertEquals(11, col1);
        assertEquals(12, col2);
    }

    private static DidoxInvoiceColumnLayout layout16() {
        Map<Integer, Float> centers = new LinkedHashMap<>();
        for (int i = 1; i <= 16; i++) {
            centers.put(i, x(i - 1));
        }
        return DidoxInvoiceColumnLayout.from(
            new DidoxInvoiceColumnLayout.NumberedHeader(0, new PdfVisualLine(0f), 16, centers)
        );
    }

    private static float x(int column) {
        return 20f + column * 62f;
    }
}
