package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;

import java.math.BigDecimal;

/**
 * Лимиты NUMERIC(18,2) и отсев ИКПУ/штрихкодов, которые парсер мог принять за цену.
 */
public final class PharmacyMoneyLimit {

    /** PostgreSQL NUMERIC(18,2): абсолютное значение строго меньше 10^16. */
    public static final BigDecimal NUMERIC_18_2_EXCLUSIVE_MAX = new BigDecimal("10000000000000000");

    /** Цена/кол-во в импорте: 13+ цифр — это уже штрихкод или ИКПУ, не сумма. */
    public static final int MAX_IMPORT_INTEGER_DIGITS = 12;

    private PharmacyMoneyLimit() {
    }

    public static boolean fitsNumeric18_2(BigDecimal value) {
        return value == null || value.abs().compareTo(NUMERIC_18_2_EXCLUSIVE_MAX) < 0;
    }

    public static boolean fitsImportDecimal(BigDecimal value) {
        if (value == null) {
            return false;
        }
        int scale = Math.max(value.scale(), 0);
        int integerDigits = value.precision() - scale;
        if (integerDigits < 0) {
            integerDigits = 0;
        }
        return integerDigits <= MAX_IMPORT_INTEGER_DIGITS;
    }

    public static void requireFitsNumeric18_2(BigDecimal value, String field) {
        if (!fitsNumeric18_2(value)) {
            throw PharmacyErrors.badRequest(
                "Сумма «" + field + "» слишком большая. В цену или количество попал ИКПУ или штрихкод. "
                    + "Проверьте сопоставление колонок и повторите импорт."
            );
        }
    }
}
