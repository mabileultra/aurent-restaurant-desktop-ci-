package com.pos.service.support;

import com.pos.sales.domain.SalePaymentMethodFilter;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SalesQuerySupportNonCashTest {

    @Test
    void nonCashPaymentMethodSetsFlag() {
        var filter = SalesQuerySupport.buildFilters(
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2026, 11, 22),
            null, null, null, null, null,
            SalePaymentMethodFilter.NON_CASH,
            null, null, null
        ).orElseThrow();
        assertTrue(filter.nonCashOnly());
        assertNull(filter.paymentMethod());
    }

    @Test
    void cardPaymentMethodStaysExact() {
        var filter = SalesQuerySupport.buildFilters(
            LocalDate.of(2026, 11, 1),
            LocalDate.of(2026, 11, 22),
            null, null, null, null, null,
            "CARD",
            null, null, null
        ).orElseThrow();
        assertFalse(filter.nonCashOnly());
        assertTrue(filter.paymentMethod() != null);
    }
}
