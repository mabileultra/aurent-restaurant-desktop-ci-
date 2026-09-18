package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacyReceiptPricingTest {

    @Test
    void withVatAddsTwelvePercent() {
        assertEquals(new BigDecimal("11200.00"), PharmacyReceiptPricing.withVat(
            new BigDecimal("10000"),
            new BigDecimal("12")
        ));
    }

    @Test
    void withoutVatReversesInclusive() {
        assertEquals(new BigDecimal("10000.00"), PharmacyReceiptPricing.withoutVat(
            new BigDecimal("11200.00"),
            new BigDecimal("12")
        ));
    }

    @Test
    void markupFromPurchaseWithVat() {
        assertEquals(new BigDecimal("25.00"), PharmacyReceiptPricing.markupFrom(
            new BigDecimal("10000.00"),
            new BigDecimal("12500.00")
        ));
    }

    @Test
    void retailFromMarkup() {
        assertEquals(new BigDecimal("12500.00"), PharmacyReceiptPricing.retailFromMarkup(
            new BigDecimal("10000.00"),
            new BigDecimal("25")
        ));
    }

    @Test
    void unitPriceSplitsPack() {
        assertEquals(new BigDecimal("1250.00"), PharmacyReceiptPricing.unitPrice(
            new BigDecimal("12500.00"),
            new BigDecimal("10")
        ));
    }

    @Test
    void zeroVatLeavesPurchase() {
        assertEquals(new BigDecimal("5000.00"), PharmacyReceiptPricing.withVat(
            new BigDecimal("5000"),
            BigDecimal.ZERO
        ));
    }
}
