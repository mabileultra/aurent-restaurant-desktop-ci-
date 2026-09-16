package com.pos.pharmacy.sales.payment;

import com.pos.pharmacy.util.MoneyCalculator;

import java.math.BigDecimal;

final class PaymentAmountScale {

    private PaymentAmountScale() {}

    static BigDecimal scale(BigDecimal value) {
        return MoneyCalculator.round(value);
    }
}
