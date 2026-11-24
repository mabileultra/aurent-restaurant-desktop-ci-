package com.pos.catalog.service.product.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductSearchMarkingNormalizerTest {

    @Test
    void markingSearchBecomesConsumerEan13() {
        assertEquals(
            "4780015831887",
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter(
                "0104780015831887217empchE93KvFp"
            )
        );
    }

    @Test
    void plainNameSearchUnchanged() {
        assertEquals("Tuborg", ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter("Tuborg"));
    }

    @Test
    void plainEanUnchanged() {
        assertEquals(
            "4780015831887",
            ProductSearchMarkingNormalizer.forSearchOrBarcodeFilter("4780015831887")
        );
    }
}
