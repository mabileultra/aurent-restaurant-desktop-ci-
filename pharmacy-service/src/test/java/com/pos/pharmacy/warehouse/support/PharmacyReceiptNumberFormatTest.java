package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyReceiptNumberFormatTest {

    private final PharmacyReceiptNumberFormat format = new PharmacyReceiptNumberFormat();

    @Test
    void formatsZeroPaddedSequence() {
        LocalDate day = LocalDate.of(2026, 9, 19);
        assertEquals("REC-20260919-", format.prefix(day));
        assertEquals("REC-20260919-0003", format.format(day, 3));
    }

    @Test
    void readsSequenceFromNumber() {
        String prefix = "REC-20260919-";
        assertEquals(2, format.sequence("REC-20260919-0002", prefix));
        assertEquals(10, format.sequence("REC-20260919-0010", prefix));
        assertEquals(0, format.sequence("PHR-20260919-0002", prefix));
        assertEquals(0, format.sequence(null, prefix));
    }
}
