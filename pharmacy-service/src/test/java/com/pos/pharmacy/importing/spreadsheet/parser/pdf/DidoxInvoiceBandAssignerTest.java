package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxInvoiceBandAssignerTest {

    @Test
    void keepsMxikInCatalogBandEvenWhenWide() {
        DidoxInvoiceColumnLayout layout = layout16();
        PdfTextRun mxik = new PdfTextRun(1, x(2), x(12), 10f, "08111001017000000 Trusi dlya detey");
        assertEquals(2, DidoxInvoiceBandAssigner.column(layout, mxik));
        assertFalse(DidoxInvoiceBandAssigner.isMoneyColumn(16, 2));
    }

    @Test
    void keepsNumericSeriesInSeriesBandWhenRunOverlapsUnit() {
        DidoxInvoiceColumnLayout layout = layout16();
        PdfTextRun series = new PdfTextRun(1, x(5), x(5) + 80f, 10f, "010726");
        assertEquals(5, DidoxInvoiceBandAssigner.column(layout, series));
        PdfTextRun code = new PdfTextRun(1, x(5), x(5) + 24f, 10f, "ZA4485");
        assertEquals(5, DidoxInvoiceBandAssigner.column(layout, code));
    }

    @Test
    void keepsSpacedMoneyInDeliveryBand() {
        DidoxInvoiceColumnLayout layout = layout16();
        PdfTextRun money = new PdfTextRun(1, x(11), x(11) + 40f, 10f, "259 678.05");
        assertEquals(11, DidoxInvoiceBandAssigner.column(layout, money));
        assertTrue(DidoxInvoiceBandAssigner.isMoneyColumn(16, 11));
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
