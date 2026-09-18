package com.pos.pharmacy.marks.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StockMarkKeysTest {

    @Test
    void primaryKeyPrefersGs1() {
        String code = "010478001234567821SERIAL91CRYPT";
        String primary = StockMarkKeys.primaryKey(code);
        assertNotNull(primary);
        assertTrue(primary.startsWith("gs1:"));
    }

    @Test
    void collectAllMergesUniqueKeys() {
        var keys = StockMarkKeys.collectAll(java.util.List.of(
            "010478001234567821SERIAL91CRYPT",
            "010478001234567821SERIAL91CRYPT"
        ));
        assertEquals(StockMarkKeys.allKeys("010478001234567821SERIAL91CRYPT").size(), keys.size());
    }
}
