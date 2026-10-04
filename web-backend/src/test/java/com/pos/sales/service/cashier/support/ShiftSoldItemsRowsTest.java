package com.pos.sales.service.cashier.support;

import com.pos.sales.dto.cashier.ShiftItemRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShiftSoldItemsRowsTest {

    @Test
    void mapsNameQuantityAndAmount() {
        List<ShiftItemRow> rows = ShiftSoldItemsRows.map(List.<Object[]>of(
            new Object[] {"Молоко", new BigDecimal("3"), new BigDecimal("45000.5")}
        ));

        assertEquals(1, rows.size());
        assertEquals("Молоко", rows.get(0).name());
        assertEquals(new BigDecimal("3.000"), rows.get(0).quantity());
        assertEquals(new BigDecimal("45000.50"), rows.get(0).amount());
    }

    @Test
    void emptyQueryIsEmptySlip() {
        assertTrue(ShiftSoldItemsRows.map(List.of()).isEmpty());
        assertTrue(ShiftSoldItemsRows.map(null).isEmpty());
    }

    @Test
    void unwrapsNestedNativeRow() {
        Object[] nested = new Object[] {"Хлеб", new BigDecimal("1.5"), new BigDecimal("8000")};
        List<ShiftItemRow> rows = ShiftSoldItemsRows.map(List.<Object[]>of(new Object[] { nested }));

        assertEquals("Хлеб", rows.get(0).name());
        assertEquals(new BigDecimal("1.500"), rows.get(0).quantity());
        assertEquals(new BigDecimal("8000.00"), rows.get(0).amount());
    }

    @Test
    void nullNameBecomesEmptyString() {
        List<ShiftItemRow> rows = ShiftSoldItemsRows.map(List.<Object[]>of(
            new Object[] { null, BigDecimal.ONE, BigDecimal.TEN }
        ));
        assertEquals("", rows.get(0).name());
    }
}
