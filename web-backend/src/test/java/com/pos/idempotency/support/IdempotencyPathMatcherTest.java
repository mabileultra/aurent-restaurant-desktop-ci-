package com.pos.idempotency.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class IdempotencyPathMatcherTest {

    @Test
    void matchesSalesAndCashMovements() {
        assertTrue(IdempotencyPathMatcher.matches("POST", "/sales"));
        assertTrue(IdempotencyPathMatcher.matches(
            "POST",
            "/cashier/shifts/11111111-1111-1111-1111-111111111111/cash-in"
        ));
        assertTrue(IdempotencyPathMatcher.matches(
            "POST",
            "/cashier/shifts/11111111-1111-1111-1111-111111111111/cash-out"
        ));
    }

    @Test
    void ignoresOtherPathsAndMethods() {
        assertFalse(IdempotencyPathMatcher.matches("GET", "/sales"));
        assertFalse(IdempotencyPathMatcher.matches("POST", "/sales/export"));
        assertFalse(IdempotencyPathMatcher.matches("POST", "/cashier/shifts/x/close"));
    }
}
