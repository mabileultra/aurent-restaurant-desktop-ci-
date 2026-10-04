package com.pos.sales.service.cashier.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Net quantity and amount for one sale line. The shift-close SQL must stay aligned with this.
 */
public final class ShiftNetSoldMath {

    private ShiftNetSoldMath() {}

    public static BigDecimal netQuantity(BigDecimal quantity, BigDecimal returned) {
        if (quantity == null || quantity.signum() <= 0) {
            return BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        }
        BigDecimal back = returned == null ? BigDecimal.ZERO : returned;
        BigDecimal net = quantity.subtract(back);
        if (net.signum() < 0) {
            net = BigDecimal.ZERO;
        }
        return net.setScale(3, RoundingMode.HALF_UP);
    }

    public static BigDecimal netAmount(BigDecimal quantity, BigDecimal returned, BigDecimal lineTotal) {
        if (quantity == null || quantity.signum() <= 0 || lineTotal == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal back = returned == null ? BigDecimal.ZERO : returned;
        if (back.compareTo(quantity) >= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal netQty = quantity.subtract(back);
        return lineTotal.multiply(netQty).divide(quantity, 2, RoundingMode.HALF_UP);
    }
}
