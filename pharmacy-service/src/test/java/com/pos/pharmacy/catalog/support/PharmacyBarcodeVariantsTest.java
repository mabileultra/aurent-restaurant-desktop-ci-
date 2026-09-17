package com.pos.pharmacy.catalog.support;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyBarcodeVariantsTest {

    @Test
    void dataMatrixYieldsGtinAndEan() {
        List<String> variants = PharmacyBarcodeVariants.of("]d2010478001234567821SERIAL\u001d91CRYPT");

        assertEquals("04780012345678", variants.get(0));
        assertTrue(variants.contains("4780012345678"));
    }

    @Test
    void plainEanStaysSearchable() {
        assertEquals(List.of("4780012345678", "04780012345678"), PharmacyBarcodeVariants.of("4780012345678"));
    }
}
