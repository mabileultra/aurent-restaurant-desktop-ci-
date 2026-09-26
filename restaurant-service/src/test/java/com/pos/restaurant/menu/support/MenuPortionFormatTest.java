package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.domain.MenuPortionUnit;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MenuPortionFormatTest {

    @Test
    void prefersLabelOverAmount() {
        assertEquals("большая", MenuPortionFormat.display(
            "большая",
            new BigDecimal("0.7"),
            MenuPortionUnit.PORTION,
            null
        ));
    }

    @Test
    void formatsOneAndHalfServing() {
        assertEquals("1 порция", MenuPortionFormat.display(null, BigDecimal.ONE, MenuPortionUnit.PORTION, null));
        assertEquals("полтора порции", MenuPortionFormat.display(
            null, new BigDecimal("1.5"), MenuPortionUnit.PORTION, null
        ));
        assertEquals("0.7 порции", MenuPortionFormat.display(
            null, new BigDecimal("0.700"), MenuPortionUnit.PORTION, null
        ));
        assertEquals("0.5 порции", MenuPortionFormat.display(
            null, new BigDecimal("0.5"), MenuPortionUnit.PORTION, null
        ));
    }

    @Test
    void formatsGramsAndPieces() {
        assertEquals("250 г", MenuPortionFormat.display(null, new BigDecimal("250"), MenuPortionUnit.G, null));
        assertEquals("1 шт", MenuPortionFormat.display(null, BigDecimal.ONE, MenuPortionUnit.PCS, null));
    }

    @Test
    void fallsBackToLegacyGrams() {
        assertEquals("180 г", MenuPortionFormat.display(null, null, null, 180));
    }

    @Test
    void emptyWhenMissing() {
        assertNull(MenuPortionFormat.display(null, null, null, null));
    }
}
