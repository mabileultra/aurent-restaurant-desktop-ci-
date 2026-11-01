package com.pos.catalog.service.product.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Canonical retail stock value: sellingPrice × max(qty, 0).
 * Negative store balances must not reduce the company retail total.
 */
public final class StockRetailValueMath {

    private StockRetailValueMath() {}

    public static BigDecimal displayQty(BigDecimal qty) {
        BigDecimal q = qty != null ? qty : BigDecimal.ZERO;
        return q.signum() < 0 ? BigDecimal.ZERO : q;
    }

    public static BigDecimal lineValue(BigDecimal sellingPrice, BigDecimal qty) {
        BigDecimal price = sellingPrice != null ? sellingPrice : BigDecimal.ZERO;
        return price.multiply(displayQty(qty));
    }

    public static BigDecimal scaleMoney(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal scaleQty(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(3, RoundingMode.HALF_UP);
    }
}
