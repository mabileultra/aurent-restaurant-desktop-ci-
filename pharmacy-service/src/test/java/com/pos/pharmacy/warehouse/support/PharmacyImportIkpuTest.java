package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportIkpuTest {

    @Test
    void takesCodeFromCatalogCell() {
        assertEquals(
            "06111001017000000",
            PharmacyImportIkpu.code("06111001017000000 - Трусы для детей")
        );
        assertNull(PharmacyImportIkpu.code("Маркировкаланган"));
    }
}
