package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class CheckoutOrderPricing {

    private CheckoutOrderPricing() {}

    public static BigDecimal normalizeOrderDiscount(BigDecimal amount, BigDecimal grossTotal) {
        if (amount == null || amount.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amount.min(grossTotal.max(BigDecimal.ZERO)).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal resolveOrderDiscountPercent(
        BigDecimal requestedPercent,
        BigDecimal orderDiscount,
        BigDecimal grossTotal
    ) {
        if (orderDiscount.signum() <= 0) {
            return null;
        }
        if (requestedPercent != null && requestedPercent.signum() > 0) {
            return requestedPercent.min(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
        }
        if (grossTotal.signum() <= 0) {
            return null;
        }
        return orderDiscount.multiply(new BigDecimal("100")).divide(grossTotal, 2, RoundingMode.HALF_UP);
    }

    public static void validatePaymentTotals(BigDecimal total, SalePaymentResolver.PaymentAmounts amounts) {
        BigDecimal paid = amounts.cash().add(amounts.card()).setScale(2, RoundingMode.HALF_UP);
        if (paid.compareTo(total) != 0) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_PAYMENT_MISMATCH);
        }
    }
}
