package com.pos.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ImportNumberNormalizerTest {

    @Test
    void keepsPlainInteger() {
        assertEquals("8000", ImportNumberNormalizer.normalize("8000"));
    }

    @Test
    void stripsSpacesAndDecimalComma() {
        assertEquals("3125000.00", ImportNumberNormalizer.normalize("3 125 000,00"));
    }

    @Test
    void stripsUsThousandCommas() {
        assertEquals("8000", ImportNumberNormalizer.normalize("8,000"));
        assertEquals("8000.00", ImportNumberNormalizer.normalize("8,000.00"));
    }

    @Test
    void stripsEuThousandDotsOnlyWhenGrouped() {
        assertEquals("1234567.89", ImportNumberNormalizer.normalize("1.234.567,89"));
        assertEquals("6000000", ImportNumberNormalizer.normalize("6.000.000"));
    }

    @Test
    void keepsSingleDotAsDecimalNotThousands() {
        // Didox/Excel qty: «288.000» / «6000.000» must stay 288 / 6000 — not ×1000.
        assertEquals("8.000", ImportNumberNormalizer.normalize("8.000"));
        assertEquals("288.000", ImportNumberNormalizer.normalize("288.000"));
        assertEquals("288.000000", ImportNumberNormalizer.normalize("288.000000"));
        assertEquals("6000.000", ImportNumberNormalizer.normalize("6000.000"));
        assertEquals("8.50", ImportNumberNormalizer.normalize("8.50"));
        assertEquals("8000.00", ImportNumberNormalizer.normalize("8000.00"));
        assertEquals("7142.86", ImportNumberNormalizer.normalize("7 142.86"));
    }
}
