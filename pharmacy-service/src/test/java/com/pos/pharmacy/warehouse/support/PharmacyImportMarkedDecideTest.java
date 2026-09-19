package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportMarkedDecideTest {

    @Test
    void invoiceFlagWins() {
        assertTrue(PharmacyImportMarkedDecide.apply(true, null));
        assertTrue(PharmacyImportMarkedDecide.apply(true, PharmacyImportTasnifHit.miss()));
        assertTrue(PharmacyImportMarkedDecide.apply(
            true,
            new PharmacyImportTasnifHit(true, false, "1546940", "name")
        ));
    }

    @Test
    void disabledOrNetworkLeavesInvoiceOnly() {
        assertFalse(PharmacyImportMarkedDecide.apply(false, null));
    }

    @Test
    void missingMxikMarksProduct() {
        assertTrue(PharmacyImportMarkedDecide.apply(false, PharmacyImportTasnifHit.miss()));
    }

    @Test
    void usesTasnifLabel() {
        assertTrue(PharmacyImportMarkedDecide.apply(
            false,
            new PharmacyImportTasnifHit(true, true, "1546940", "name")
        ));
        assertFalse(PharmacyImportMarkedDecide.apply(
            false,
            new PharmacyImportTasnifHit(true, false, "1546940", "name")
        ));
    }
}
