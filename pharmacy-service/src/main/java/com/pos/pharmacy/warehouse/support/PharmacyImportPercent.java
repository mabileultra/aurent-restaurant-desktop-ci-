package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** НДС/скидка: NUMERIC(5,2), иначе сумма фактуры попадает в ставку. */
public final class PharmacyImportPercent {

    private static final BigDecimal MAX = new BigDecimal("100");

    private PharmacyImportPercent() {}

    public static BigDecimal vatRate(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0 || value.compareTo(MAX) > 0) {
            return BigDecimal.ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
