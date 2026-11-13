package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportTasnifRxLookTest {

    @Test
    void readsCatalogText() {
        assertEquals(Boolean.FALSE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, false, null, "Рецептсиз препарат", null)
        ));
        assertEquals(Boolean.TRUE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, true, null, "Рецептурный препарат", null)
        ));
        assertEquals(Boolean.TRUE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, true, null, "Retseptli dori", null)
        ));
        assertNull(PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, false, null, "Кюпен таблетки", null)
        ));
        assertNull(PharmacyImportTasnifRxLook.of(PharmacyImportTasnifHit.miss()));
        assertNull(PharmacyImportTasnifRxLook.of(null));
    }
}
