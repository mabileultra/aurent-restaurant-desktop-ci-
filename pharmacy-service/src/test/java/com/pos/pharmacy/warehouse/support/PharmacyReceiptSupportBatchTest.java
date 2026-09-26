package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class PharmacyReceiptSupportBatchTest {

    @Test
    void keepsShortBatch() {
        assertEquals("AB-12", PharmacyReceiptSupport.batchOrNull("  AB-12 "));
    }

    @Test
    void cutsBatchToColumnLimit() {
        String longBatch = "S".repeat(90);
        assertEquals(80, PharmacyReceiptSupport.batchOrNull(longBatch).length());
    }

    @Test
    void blankBatchIsNull() {
        assertNull(PharmacyReceiptSupport.batchOrNull("   "));
    }
}
