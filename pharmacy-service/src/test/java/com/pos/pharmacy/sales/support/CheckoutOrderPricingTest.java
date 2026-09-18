package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CheckoutOrderPricingTest {

    @Test
    void normalizeOrderDiscountCapsAtGross() {
        assertEquals(new BigDecimal("50.00"), CheckoutOrderPricing.normalizeOrderDiscount(
            new BigDecimal("999"),
            new BigDecimal("50.00")
        ));
    }

    @Test
    void resolveOrderDiscountPercentFromAmount() {
        assertEquals(new BigDecimal("10.00"), CheckoutOrderPricing.resolveOrderDiscountPercent(
            null,
            new BigDecimal("100.00"),
            new BigDecimal("1000.00")
        ));
    }

    @Test
    void resolveOrderDiscountPercentNullWhenNoDiscount() {
        assertNull(CheckoutOrderPricing.resolveOrderDiscountPercent(
            null,
            BigDecimal.ZERO.setScale(2),
            new BigDecimal("1000.00")
        ));
    }

    @Test
    void validatePaymentTotalsRejectsMismatch() {
        SalePaymentResolver.PaymentAmounts amounts = new SalePaymentResolver.PaymentAmounts(
            new BigDecimal("100.00"),
            new BigDecimal("50.00"),
            new BigDecimal("150.00"),
            BigDecimal.ZERO
        );
        assertThrows(BusinessException.class, () ->
            CheckoutOrderPricing.validatePaymentTotals(new BigDecimal("200.00"), amounts)
        );
    }
}
