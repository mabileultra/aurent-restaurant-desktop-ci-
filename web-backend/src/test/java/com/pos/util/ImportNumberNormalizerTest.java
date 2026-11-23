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
    void stripsEuThousandDots() {
        assertEquals("8000", ImportNumberNormalizer.normalize("8.000"));
        assertEquals("1234567.89", ImportNumberNormalizer.normalize("1.234.567,89"));
    }

    @Test
    void keepsDecimalDotWithTwoPlaces() {
        assertEquals("8.50", ImportNumberNormalizer.normalize("8.50"));
        assertEquals("8000.00", ImportNumberNormalizer.normalize("8000.00"));
    }
}
