package com.pos.shared.money;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Остаток выручки после возврата: header минус сумма возврата, нал/карта пропорционально.
 */
public final class TenderNetCalculator {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private TenderNetCalculator() {}

    public static TenderNet remaining(
        BigDecimal totalAmount,
        BigDecimal cashAmount,
        BigDecimal cardAmount,
        BigDecimal returnedAmount
    ) {
        BigDecimal total = scale(totalAmount);
        BigDecimal cash = scale(cashAmount);
        BigDecimal card = scale(cardAmount);
        BigDecimal returned = scale(returnedAmount);
        if (returned.signum() < 0) {
            returned = ZERO;
        }
        if (returned.compareTo(total) > 0) {
            returned = total;
        }
        BigDecimal netTotal = total.subtract(returned).setScale(2, RoundingMode.HALF_UP);
        if (total.signum() == 0 || netTotal.signum() == 0) {
            return new TenderNet(netTotal, ZERO, ZERO);
        }
        if (netTotal.compareTo(total) == 0) {
            return new TenderNet(total, cash, card);
        }
        BigDecimal ratio = netTotal.divide(total, 8, RoundingMode.HALF_UP);
        BigDecimal netCash = cash.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netCard = card.multiply(ratio).setScale(2, RoundingMode.HALF_UP);
        BigDecimal drift = netTotal.subtract(netCash).subtract(netCard);
        if (drift.signum() != 0) {
            if (netCard.compareTo(netCash) >= 0) {
                netCard = netCard.add(drift);
            } else {
                netCash = netCash.add(drift);
            }
        }
        return new TenderNet(netTotal, netCash.max(ZERO), netCard.max(ZERO));
    }

    private static BigDecimal scale(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }
}
