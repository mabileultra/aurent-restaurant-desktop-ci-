package com.pos.pharmacy.util;

/**
 * Нормализация чисел из Excel / счёт-фактур (пробелы тысяч, {@code 8,000}, {@code 1.234,56}).
 * Один {@code .} — десятичная часть ({@code 288.000} → 288), не EU-тысячи.
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
                return s.replace(".", "").replace(',', '.');
            }
            return s.replace(",", "");
        }

        if (hasComma) {
            int comma = s.indexOf(',');
            String after = s.substring(comma + 1);
            if (after.length() <= 2 && s.indexOf(',', comma + 1) < 0) {
                return s.replace(',', '.');
            }
            return s.replace(",", "");
        }

        if (hasDot) {
            int first = s.indexOf('.');
            int last = s.lastIndexOf('.');
            if (first != last) {
                String afterLast = s.substring(last + 1);
                if (afterLast.length() == 3) {
                    return s.replace(".", "");
                }
                return s.substring(0, last).replace(".", "") + "." + afterLast;
            }
            // Один '.': десятичная часть (не тысячи). См. web-backend ImportNumberNormalizer.
        }

        return s;
    }
}
