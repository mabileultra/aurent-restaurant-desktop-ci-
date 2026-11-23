package com.pos.util;

/**
 * Нормализация чисел из Excel / счёт-фактур (пробелы тысяч, {@code 8,000}, {@code 1.234.567}).
 * Один {@code .} — десятичная часть ({@code 288.000} остаётся 288), не тысячи.
 */
public final class ImportNumberNormalizer {

    private ImportNumberNormalizer() {
    }

    /**
     * {@code 3 125 000,00} → {@code 3125000.00}; {@code 8,000} → {@code 8000}; {@code 288.000} → {@code 288.000}.
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim()
            .replace("\u00a0", "")
            .replace("\u202f", "")
            .replace(" ", "");
        if (s.isEmpty()) {
            return s;
        }

        boolean hasComma = s.indexOf(',') >= 0;
        boolean hasDot = s.indexOf('.') >= 0;

        if (hasComma && hasDot) {
            int lastComma = s.lastIndexOf(',');
            int lastDot = s.lastIndexOf('.');
            if (lastComma > lastDot) {
                // 1.234.567,89
                return s.replace(".", "").replace(',', '.');
            }
            // 1,234,567.89
            return s.replace(",", "");
        }

        if (hasComma) {
            int comma = s.indexOf(',');
            String after = s.substring(comma + 1);
            if (after.length() <= 2 && s.indexOf(',', comma + 1) < 0) {
                // 8000,00
                return s.replace(',', '.');
            }
            // 8,000 or 1,234,567
            return s.replace(",", "");
        }

        if (hasDot) {
            int first = s.indexOf('.');
            int last = s.lastIndexOf('.');
            if (first != last) {
                // 1.234.567 / 6.000.000 — EU-тысячи (несколько групп)
                String afterLast = s.substring(last + 1);
                if (afterLast.length() == 3) {
                    return s.replace(".", "");
                }
                // 1.234.56 — редкий битый формат: убрать тысячи, оставить десятичные
                return s.substring(0, last).replace(".", "") + "." + afterLast;
            }
            // Один '.': всегда десятичная часть.
            // Didox/Excel qty «288.000» / «6000.000» иначе становились 288000 / 6000000,
            // а цена строки / qty падала до 0.01. EU-тысячи только через несколько точек
            // («1.234.567») или запятую («8,000»).
        }

        return s;
    }
}
