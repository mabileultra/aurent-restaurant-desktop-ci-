package com.pos.restaurant.edge.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class EdgePinDigestTest {

    @Test
    void normalizeStripsNonDigits() {
        assertEquals("1234", EdgePinDigest.normalizePin("12-34"));
        assertEquals("", EdgePinDigest.normalizePin("   "));
    }

    @Test
    void digestMatchesIdentityHmac() {
        String first = EdgePinDigest.digestHex("12-34", "store-secret");
        String second = EdgePinDigest.digestHex("1234", "store-secret");
        assertEquals(first, second);
        assertEquals(64, first.length());
        assertNotEquals(first, EdgePinDigest.digestHex("1234", "other-secret"));
    }
}
