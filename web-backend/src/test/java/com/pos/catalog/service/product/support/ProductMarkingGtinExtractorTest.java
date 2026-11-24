package com.pos.catalog.service.product.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductMarkingGtinExtractorTest {

    @Test
    void extractsGtinFromTuborgKm() {
        assertEquals(
            "04780015831887",
            ProductMarkingGtinExtractor.extractGtin14("0104780015831887217empchE93KvFp")
        );
        assertTrue(ProductMarkingGtinExtractor.looksLikeMarkingCode("0104780015831887217empchE93KvFp"));
    }

    @Test
    void plainEanIsNotMarking() {
        assertFalse(ProductMarkingGtinExtractor.looksLikeMarkingCode("4780015831887"));
        assertFalse(ProductMarkingGtinExtractor.looksLikeMarkingCode("03004409005039001"));
    }

    @Test
    void packGtinMapsToConsumerEan13() {
        // indicator 1 → пересчёт check digit (как shared-marking)
        String ean = ProductMarkingGtinExtractor.ean13FromPackGtin14("14780131183003");
        assertEquals(13, ean.length());
        assertTrue(ean.startsWith("478013118300"));
    }
}
