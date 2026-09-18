package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DidoxInvoiceRowNumbersTest {

    @Test
    void readsRowNumberOnlyWhenDelimited() {
        assertEquals(1, DidoxInvoiceRowNumbers.leading("1 Trusi dlya"));
        assertEquals(2, DidoxInvoiceRowNumbers.leading("2"));
        assertNull(DidoxInvoiceRowNumbers.leading("50шт"));
        assertEquals(50, DidoxInvoiceRowNumbers.leading("50 шт"));
        assertNull(DidoxInvoiceRowNumbers.leading("08111001017000000"));
    }
}
