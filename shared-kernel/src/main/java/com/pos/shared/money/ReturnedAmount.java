package com.pos.shared.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Сумма возврата: оригинал чека минус оставшаяся выручка.
 */
public final class ReturnedAmount {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private ReturnedAmount() {
    }

    public static BigDecimal of(BigDecimal originalTotal, BigDecimal netTotal) {
        BigDecimal original = scale(originalTotal);
        BigDecimal net = scale(netTotal);
        BigDecimal returned = original.subtract(net);
        return returned.signum() > 0 ? returned : ZERO;
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}
