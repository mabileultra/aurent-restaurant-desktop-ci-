package com.pos.pharmacy.sales.support;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyMarkIdentityKeysTest {

    @Test
    void buildsFullAndGs1Keys() {
        String code = "010478001234567821SERIAL91CRYPT";
        Set<String> keys = PharmacyMarkIdentityKeys.keysOf(code);
        assertTrue(keys.stream().anyMatch(k -> k.startsWith("full:")));
        assertTrue(keys.stream().anyMatch(k -> k.startsWith("gs1:01") && k.contains("|21")));
    }

    @Test
    void stripsGsAndSpaces() {
        String code = "010478001234567821ABCD\u001D91XX";
        Set<String> keys = PharmacyMarkIdentityKeys.keysOf(code);
        assertFalse(keys.isEmpty());
        assertTrue(keys.stream().noneMatch(k -> k.contains("\u001d")));
    }

    @Test
    void emptyRawYieldsNoKeys() {
        assertTrue(PharmacyMarkIdentityKeys.keysOf("").isEmpty());
        assertTrue(PharmacyMarkIdentityKeys.keysOf("   ").isEmpty());
        assertTrue(PharmacyMarkIdentityKeys.keysOf(null).isEmpty());
    }
}
