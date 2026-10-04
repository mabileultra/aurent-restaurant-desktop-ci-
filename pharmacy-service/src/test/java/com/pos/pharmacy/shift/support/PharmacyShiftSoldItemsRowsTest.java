package com.pos.pharmacy.shift.support;

import com.pos.pharmacy.shift.dto.ShiftItemRow;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyShiftSoldItemsRowsTest {

    @Test
    void mapsNameQuantityAndAmount() {
        List<ShiftItemRow> rows = PharmacyShiftSoldItemsRows.map(List.<Object[]>of(
            new Object[] {"Парацетамол", new BigDecimal("2"), new BigDecimal("18000")}
        ));

        assertEquals("Парацетамол", rows.get(0).name());
        assertEquals(new BigDecimal("2.000"), rows.get(0).quantity());
        assertEquals(new BigDecimal("18000.00"), rows.get(0).amount());
    }

    @Test
    void emptyQueryIsEmptySlip() {
        assertTrue(PharmacyShiftSoldItemsRows.map(null).isEmpty());
    }

    @Test
    void unwrapsNestedNativeRow() {
        Object[] nested = new Object[] {"Ибупрофен", new BigDecimal("1"), new BigDecimal("12000.4")};
        List<ShiftItemRow> rows = PharmacyShiftSoldItemsRows.map(List.<Object[]>of(new Object[] { nested }));

        assertEquals("Ибупрофен", rows.get(0).name());
        assertEquals(new BigDecimal("1.000"), rows.get(0).quantity());
        assertEquals(new BigDecimal("12000.40"), rows.get(0).amount());
    }
}
