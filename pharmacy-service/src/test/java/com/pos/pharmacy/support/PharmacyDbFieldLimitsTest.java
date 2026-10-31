package com.pos.pharmacy.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyDbFieldLimitsTest {

    @Test
    void truncatesPackageCodeToColumnWidth() {
        String raw = "1234567890123456789012345";
        assertEquals(20, PharmacyDbFieldLimits.packageCode(raw).length());
        assertEquals("12345678901234567890", PharmacyDbFieldLimits.packageCode(raw));
    }

    @Test
    void clampsMarkupToNumeric8_2() {
        assertEquals(
            new BigDecimal("999999.99"),
            PharmacyDbFieldLimits.markupPercent(new BigDecimal("5000000"))
        );
        assertEquals(
            new BigDecimal("12.50"),
            PharmacyDbFieldLimits.markupPercent(new BigDecimal("12.5"))
        );
        assertNull(PharmacyDbFieldLimits.markupPercent(null));
    }

    @Test
    void truncatesBlankToNull() {
        assertNull(PharmacyDbFieldLimits.ikpu("  "));
        assertNull(PharmacyDbFieldLimits.barcode(null));
    }
}
