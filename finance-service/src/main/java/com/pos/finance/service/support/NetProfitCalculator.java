package com.pos.finance.service.support;

import java.math.BigDecimal;

/**
 * Managerial net profit: prefer COGS-based P&amp;L; otherwise cash result plus credit purchases.
 */
public final class NetProfitCalculator {

    private NetProfitCalculator() {
    }

    public static BigDecimal calculate(
        BigDecimal revenue,
        BigDecimal expenses,
        BigDecimal purchaseCashExpense,
        BigDecimal creditPurchaseAccrual,
        BigDecimal cogs,
        BigDecimal supplierPayments
    ) {
        BigDecimal rev = nz(revenue);
        BigDecimal exp = nz(expenses);
        BigDecimal purchaseCash = nz(purchaseCashExpense);
        BigDecimal credit = nz(creditPurchaseAccrual);
        BigDecimal cost = nz(cogs);
        BigDecimal payments = nz(supplierPayments);

        if (cost.signum() > 0) {
            BigDecimal operating = exp.subtract(purchaseCash).subtract(payments);
            if (operating.signum() < 0) {
                operating = BigDecimal.ZERO;
            }
            return rev.subtract(cost).subtract(operating);
        }
        return rev.subtract(exp).subtract(credit);
    }

    public static BigDecimal purchaseTotal(BigDecimal purchaseCashExpense, BigDecimal creditPurchaseAccrual) {
        return nz(purchaseCashExpense).add(nz(creditPurchaseAccrual));
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
