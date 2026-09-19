package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyImportTasnifPackagePickTest {

    @Test
    void picksOnlyWhenOneRealCode() {
        assertEquals("1546940", PharmacyImportTasnifPackagePick.single(List.of("1546940")));
        assertEquals("1546940", PharmacyImportTasnifPackagePick.single(List.of("1546940", "1546940")));
        assertNull(PharmacyImportTasnifPackagePick.single(List.of("1546940", "1546941")));
    }

    @Test
    void skipsDummyUnitCode() {
        assertNull(PharmacyImportTasnifPackagePick.single(List.of("1")));
        assertEquals("1546940", PharmacyImportTasnifPackagePick.single(List.of("1", "1546940")));
    }
}
