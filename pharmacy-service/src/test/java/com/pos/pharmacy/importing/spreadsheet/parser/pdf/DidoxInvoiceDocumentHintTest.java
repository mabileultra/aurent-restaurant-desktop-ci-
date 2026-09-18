package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxInvoiceDocumentHintTest {

    @Test
    void detectsHisobFakturaTitle() {
        PdfVisualLine line = new PdfVisualLine(10f);
        line.add(new PdfTextToken(1, 0f, 80f, 10f, "Hisob-faktura IS-00008429"));
        assertTrue(DidoxInvoiceDocumentHint.isHisobFaktura(List.of(line)));
        PdfVisualLine other = new PdfVisualLine(10f);
        other.add(new PdfTextToken(1, 0f, 40f, 10f, "mahsulot nomi"));
        assertFalse(DidoxInvoiceDocumentHint.isHisobFaktura(List.of(other)));
    }
}
