package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportTasnifRxLookTest {

    @Test
    void readsCatalogText() {
        assertEquals(Boolean.FALSE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, false, null, "Рецептсиз препарат")
        ));
        assertEquals(Boolean.TRUE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, true, null, "Рецептурный препарат")
        ));
        assertEquals(Boolean.TRUE, PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, true, null, "Retseptli dori")
        ));
        assertNull(PharmacyImportTasnifRxLook.of(
            new PharmacyImportTasnifHit(true, false, null, "Кюпен таблетки")
        ));
        assertNull(PharmacyImportTasnifRxLook.of(PharmacyImportTasnifHit.miss()));
        assertNull(PharmacyImportTasnifRxLook.of(null));
    }
}
