package com.pos.identity.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class CashierPinUtilTest {

    @Test
    void stripsNonDigits() {
        assertEquals("1234", CashierPinUtil.normalizePin("12-34"));
        assertEquals("", CashierPinUtil.normalizePin("   "));
        assertEquals("", CashierPinUtil.normalizePin(null));
    }

    @Test
    void samePinAndSecretAlwaysHashTheSame() {
        String first = CashierPinUtil.digestHex("12-34", "store-secret");
        String second = CashierPinUtil.digestHex("1234", "store-secret");
        assertEquals(first, second);
        assertEquals(64, first.length());
    }

    @Test
    void differentSecretChangesDigest() {
        assertNotEquals(
            CashierPinUtil.digestHex("1234", "one"),
            CashierPinUtil.digestHex("1234", "two")
        );
    }

    @Test
    void emptyPinDoesNotProduceDigest() {
        assertEquals("", CashierPinUtil.digestHex("abc", "secret"));
    }
}
