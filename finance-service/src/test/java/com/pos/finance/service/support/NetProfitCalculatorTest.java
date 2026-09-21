package com.pos.finance.service.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NetProfitCalculatorTest {

    @Test
    void withCogsExcludesPurchaseCashAndSupplierPaymentsFromOpex() {
        BigDecimal net = NetProfitCalculator.calculate(
            new BigDecimal("100000"),
            new BigDecimal("35000"),
            new BigDecimal("20000"),
            new BigDecimal("5000"),
            new BigDecimal("40000"),
            new BigDecimal("10000")
        );
        // revenue 100k - cogs 40k - opex (35k - 20k purchase - 10k supplier pay) = 55k
        assertEquals(new BigDecimal("55000"), net);
    }

    @Test
    void withoutCogsSubtractsExpensesAndCreditPurchases() {
        BigDecimal net = NetProfitCalculator.calculate(
            new BigDecimal("100000"),
            new BigDecimal("10000"),
            BigDecimal.ZERO,
            new BigDecimal("30000"),
            BigDecimal.ZERO,
            BigDecimal.ZERO
        );
        assertEquals(new BigDecimal("60000"), net);
    }

    @Test
    void purchaseTotalSumsCashAndCredit() {
        assertEquals(
            new BigDecimal("15000"),
            NetProfitCalculator.purchaseTotal(new BigDecimal("10000"), new BigDecimal("5000"))
        );
    }
}
