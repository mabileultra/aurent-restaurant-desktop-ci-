package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportInvoiceRxLookTest {

    @Test
    void readsDidoxDispenseColumn() {
        assertEquals(Boolean.TRUE, PharmacyImportInvoiceRxLook.of("Рецептли"));
        assertEquals(Boolean.FALSE, PharmacyImportInvoiceRxLook.of("Рецептсиз"));
        assertEquals(Boolean.TRUE, PharmacyImportInvoiceRxLook.of("Retseptli"));
        assertEquals(Boolean.FALSE, PharmacyImportInvoiceRxLook.of("Retseptsiz"));
        assertNull(PharmacyImportInvoiceRxLook.of("dona"));
        assertNull(PharmacyImportInvoiceRxLook.of(""));
    }
}
