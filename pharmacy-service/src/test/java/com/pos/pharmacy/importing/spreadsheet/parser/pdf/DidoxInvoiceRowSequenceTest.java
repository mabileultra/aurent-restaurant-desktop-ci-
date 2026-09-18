package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DidoxInvoiceRowSequenceTest {

    @Test
    void acceptsConsecutiveProductNumbersNotWrappedQty() {
        assertTrue(DidoxInvoiceRowSequence.isNext(0, 1));
        assertTrue(DidoxInvoiceRowSequence.isNext(1, 2));
        assertTrue(DidoxInvoiceRowSequence.isNext(2, 3));
        assertFalse(DidoxInvoiceRowSequence.isNext(1, 50));
        assertFalse(DidoxInvoiceRowSequence.isNext(0, 50));
        assertFalse(DidoxInvoiceRowSequence.isNext(3, 3));
    }
}
