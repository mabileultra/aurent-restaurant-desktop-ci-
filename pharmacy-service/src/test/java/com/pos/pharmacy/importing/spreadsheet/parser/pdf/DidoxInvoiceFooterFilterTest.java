package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxInvoiceFooterFilterTest {

    @Test
    void detectsDidoxTotalsAndSignatures() {
        assertTrue(DidoxInvoiceFooterFilter.isFooterText("Jami:"));
        assertTrue(DidoxInvoiceFooterFilter.isFooter(List.of("Жами", "176 355.00")));
        assertTrue(DidoxInvoiceFooterFilter.isFooterText("Bekitish imkoniyati"));
        assertFalse(DidoxInvoiceFooterFilter.isFooter(List.of("1 Trusi dlya malchikov", "10.00000")));
        assertFalse(DidoxInvoiceFooterFilter.isFooterText("Mahsulot nomi"));
    }
}
