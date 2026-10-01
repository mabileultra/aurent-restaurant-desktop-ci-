package com.pos.restaurant.menu.support;

import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.entity.MenuItem;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Guest/kitchen display for a fixed plate portion (not recipe outputQty). */
public final class MenuPortionFormat {

    private static final BigDecimal ONE = BigDecimal.ONE;
    private static final BigDecimal ONE_HALF = new BigDecimal("1.5");

    private MenuPortionFormat() {}

    public static String display(MenuItem item) {
        if (item == null) {
            return null;
        }
        return display(
            item.getPortionLabel(),
            item.getPortionAmount(),
            item.getPortionUnit(),
            item.getPortionGrams()
        );
    }

    public static String display(
        String portionLabel,
        BigDecimal portionAmount,
        MenuPortionUnit portionUnit,
        Integer portionGrams
    ) {
        if (portionLabel != null && !portionLabel.isBlank()) {
            return portionLabel.trim();
        }
        if (portionAmount != null && portionAmount.signum() > 0) {
            MenuPortionUnit unit = portionUnit == null ? MenuPortionUnit.PORTION : portionUnit;
            return switch (unit) {
                case G -> stripTrailingZeros(portionAmount) + " г";
                case KG -> stripTrailingZeros(portionAmount) + " кг";
                case PCS -> formatPieces(portionAmount);
                case PORTION -> formatServing(portionAmount);
            };
        }
        if (portionGrams != null && portionGrams > 0) {
            return portionGrams + " г";
        }
        return null;
    }

    /** 1 → «1 порция», 1.5 → «полтора порции», иначе «0.7 порции». */
    static String formatServing(BigDecimal amount) {
        BigDecimal normalized = amount.stripTrailingZeros();
        if (normalized.compareTo(ONE) == 0) {
            return "1 порция";
        }
        if (normalized.compareTo(ONE_HALF) == 0) {
            return "полтора порции";
        }
        return stripTrailingZeros(amount) + " порции";
    }

    static String formatPieces(BigDecimal amount) {
        BigDecimal normalized = amount.stripTrailingZeros();
        if (normalized.compareTo(ONE) == 0) {
            return "1 шт";
        }
        return stripTrailingZeros(amount) + " шт";
    }

    private static String stripTrailingZeros(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    public static Integer gramsFromAmount(BigDecimal amount, MenuPortionUnit unit) {
        if (amount == null || amount.signum() <= 0 || unit == null) {
            return null;
        }
        BigDecimal grams = switch (unit) {
            case G -> amount;
            case KG -> amount.multiply(BigDecimal.valueOf(1000));
            default -> null;
        };
        if (grams == null) {
            return null;
        }
        BigDecimal rounded = grams.setScale(0, RoundingMode.HALF_UP);
        if (rounded.signum() <= 0) {
            return null;
        }
        return rounded.intValueExact();
    }

    /** Base weight for price: at most 10 kg. */
    public static void requireWeightWithinLimit(BigDecimal amount, MenuPortionUnit unit) {
        Integer grams = gramsFromAmount(amount, unit);
        if (grams == null) {
            return;
        }
        if (grams > 10_000) {
            throw new IllegalArgumentException("Portion weight must be at most 10 kg");
        }
    }
}
