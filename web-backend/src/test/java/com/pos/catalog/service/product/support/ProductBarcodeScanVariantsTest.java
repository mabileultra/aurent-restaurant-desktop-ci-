package com.pos.catalog.service.product.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductBarcodeScanVariantsTest {

    @Test
    void ean13ExpandsToShortAndGtin14() {
        var variants = ProductBarcodeScanVariants.of("8801046877388");
        assertEquals("8801046877388", variants.get(0));
        assertTrue(variants.contains("880104687738"));
        assertTrue(variants.contains("08801046877388"));
    }
}
