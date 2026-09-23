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

    @Test
    void padsLeadingZeroWhenExcelDropsIt() {
        assertEquals("03004409005039001", PharmacyImportIkpu.code("3004409005039001"));
        assertEquals("03004409005039001", PharmacyImportIkpu.pad17("3004409005039001"));
    }

    @Test
    void expandsScientificNotation() {
        // 16 значащих цифр без ведущего 0 → E+15 в Excel
        assertEquals("03004409005039001", PharmacyImportIkpu.code("3,004409005039001E+15"));
        assertEquals("03004409005039001", PharmacyImportIkpu.code("3.004409005039001E+15"));
    }
}
