package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.domain.CashOpType;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Drawer: opening + cash sales + IN − OUT − collection. */
public final class ShiftCashMath {

    public record Drawer(BigDecimal cashIn, BigDecimal cashOut, BigDecimal collection) {

        public static Drawer zero() {
            return new Drawer(money(BigDecimal.ZERO), money(BigDecimal.ZERO), money(BigDecimal.ZERO));
        }

        public Drawer plus(CashOpType type, BigDecimal amount) {
            BigDecimal value = money(amount);
            return switch (type) {
                case IN -> new Drawer(cashIn.add(value), cashOut, collection);
                case OUT -> new Drawer(cashIn, cashOut.add(value), collection);
                case COLLECTION -> new Drawer(cashIn, cashOut, collection.add(value));
            };
        }

        public BigDecimal net() {
            return cashIn.subtract(cashOut).subtract(collection);
        }
    }

    private ShiftCashMath() {
    }

    public static BigDecimal expected(BigDecimal openingCash, BigDecimal cashSales, Drawer drawer) {
        return money(openingCash).add(money(cashSales)).add(drawer == null ? BigDecimal.ZERO : drawer.net());
    }

    public static BigDecimal difference(BigDecimal closingCash, BigDecimal expectedCash) {
        if (closingCash == null) {
            return null;
        }
        return money(closingCash).subtract(money(expectedCash));
    }

    public static BigDecimal money(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
