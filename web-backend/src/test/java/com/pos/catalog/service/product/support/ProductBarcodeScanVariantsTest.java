package com.pos.catalog.service.product.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductBarcodeScanVariantsTest {

    /** Реальный КМ Tuborg с прода: поиск/by-barcode ломались на сырой строке. */
    private static final String TUBORG_KM = "0104780015831887217empchE93KvFp";

    @Test
    void ean13ExpandsToShortAndGtin14() {
        var variants = ProductBarcodeScanVariants.of("8801046877388");
        assertEquals("8801046877388", variants.get(0));
        assertTrue(variants.contains("880104687738"));
        assertTrue(variants.contains("08801046877388"));
    }

    @Test
    void markingCodeExpandsToGtinAndConsumerEan() {
        var variants = ProductBarcodeScanVariants.of(TUBORG_KM);
        assertTrue(variants.contains("04780015831887"));
        assertTrue(variants.contains("4780015831887"));
    }

    @Test
    void markingWithGsSeparatorStillYieldsEan() {
        var variants = ProductBarcodeScanVariants.of(
            "0104780015831887217empch\u001d93KvFp"
        );
        assertTrue(variants.contains("4780015831887"));
    }

    @Test
    void bareGtin14PlusSerialYieldsEan8StyleCard() {
        var variants = ProductBarcodeScanVariants.of("000000478043577xv.2/=z0yd2Fku");
        assertTrue(variants.contains("00000047804357"));
        assertTrue(variants.contains("47804357"));
    }
}
