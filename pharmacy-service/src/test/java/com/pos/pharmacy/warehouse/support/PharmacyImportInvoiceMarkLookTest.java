package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportInvoiceMarkLookTest {

    @Test
    void readsFlagNotDatamatrix() {
        assertTrue(PharmacyImportInvoiceMarkLook.of(List.of(
            "Кюпен таб", "Маркировкаланган", "03004409005052001"
        )));
        assertTrue(PharmacyImportInvoiceMarkLook.flagCell("Markirovkalangan №100(10x10)"));
        assertFalse(PharmacyImportInvoiceMarkLook.of(List.of("Кюпен таб", "", "03004")));
        assertFalse(PharmacyImportInvoiceMarkLook.flagCell("Маркировка коди"));
    }
}
