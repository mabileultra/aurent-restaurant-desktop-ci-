package com.pos.pharmacy.cache;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyBarcodeCacheKeysTest {

    @Test
    void buildsStableKey() {
        assertEquals(
            "pharm:product:barcode:10:5:4601234567890",
            PharmacyBarcodeCacheKeys.of(10, 5, "4601234567890")
        );
    }

    @Test
    void keysForScanIncludeGtinVariants() {
        List<String> keys = PharmacyBarcodeCacheKeys.keysForScan(10, 5, "04601234567890");
        assertTrue(keys.stream().anyMatch(k -> k.endsWith(":04601234567890")));
        assertTrue(keys.stream().anyMatch(k -> k.endsWith(":4601234567890")));
    }

    @Test
    void storePrefixScoped() {
        assertEquals("pharm:product:barcode:10:5:", PharmacyBarcodeCacheKeys.storePrefix(10, 5));
    }
}
