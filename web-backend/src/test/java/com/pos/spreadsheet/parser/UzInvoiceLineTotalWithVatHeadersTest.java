package com.pos.spreadsheet.parser;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UzInvoiceLineTotalWithVatHeadersTest {

    @Test
    void uzDeliveryValueWithVatMatches() {
        assertTrue(UzInvoiceLineTotalWithVatHeaders.matches(
            "Етказиб беришнинг ҚҚСни ҳисобга олган ҳолда қиймати"
        ));
    }

    @Test
    void unitPriceWithVatDoesNotMatch() {
        assertFalse(UzInvoiceLineTotalWithVatHeaders.matches("Unit price with VAT"));
        assertFalse(UzInvoiceLineTotalWithVatHeaders.matches("Цена including VAT"));
    }
}
