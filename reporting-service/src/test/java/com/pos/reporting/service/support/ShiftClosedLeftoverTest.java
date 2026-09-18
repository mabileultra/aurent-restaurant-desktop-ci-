package com.pos.reporting.service.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShiftClosedLeftoverTest {

    @Test
    void hidesEmptyFactWhenShiftAlreadyHasAnotherZ() {
        assertTrue(ShiftClosedLeftover.hideEmptySibling(0, BigDecimal.ZERO, true));
    }

    @Test
    void keepsSoleEmptyShiftClose() {
        assertFalse(ShiftClosedLeftover.hideEmptySibling(0, BigDecimal.ZERO, false));
    }

    @Test
    void keepsNonEmptySibling() {
        assertFalse(ShiftClosedLeftover.hideEmptySibling(4, new BigDecimal("1000"), true));
    }
}
