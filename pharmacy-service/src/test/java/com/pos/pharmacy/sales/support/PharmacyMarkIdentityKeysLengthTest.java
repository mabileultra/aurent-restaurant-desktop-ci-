package com.pos.pharmacy.sales.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyMarkIdentityKeysLengthTest {

    @Test
    void fullKeyCanExceedLegacyVarchar190() {
        String code = "01" + "0".repeat(14) + "21" + "A".repeat(20) + "91" + "X".repeat(160);
        String full = PharmacyMarkIdentityKeys.keysOf(code).stream()
            .filter(key -> key.startsWith("full:"))
            .findFirst()
            .orElseThrow();
        assertTrue(full.length() > 190, () -> "expected long DataMatrix key, got " + full.length());
    }
}
