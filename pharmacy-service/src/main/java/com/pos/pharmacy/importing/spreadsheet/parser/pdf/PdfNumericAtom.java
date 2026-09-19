package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.regex.Pattern;

/** Атом числа на фактуре: сумма с пробелом-тысячами, % НДС, количество 10.00000. */
public final class PdfNumericAtom {

    private static final Pattern PERCENT = Pattern.compile("^\\d{1,2}(?:[.,]\\d+)?\\s*%$");
    private static final Pattern SPACED_MONEY = Pattern.compile("^\\d{1,3}(?:\\s\\d{3})+(?:[.,]\\d+)?$");
    private static final Pattern DECIMAL = Pattern.compile("^\\d+[.,]\\d{1,5}$");
    private static final Pattern PLAIN_INT = Pattern.compile("^\\d{1,12}$");
    private static final Pattern THOUSANDS_TAIL = Pattern.compile("^\\d{3}(?:[.,]\\d+)?$");

    private PdfNumericAtom() {}

    public static boolean looksComplete(String text) {
        String value = norm(text);
        if (value.isEmpty()) {
            return false;
        }
        return PERCENT.matcher(value).matches()
            || SPACED_MONEY.matcher(value).matches()
            || DECIMAL.matcher(value).matches()
            || (looksPlainInteger(value) && value.length() >= 4);
    }

    /** Целое без разрядов и точки: серия 010726, не сумма и не 10.00000. */
    public static boolean looksPlainInteger(String text) {
        String value = norm(text);
        return PLAIN_INT.matcher(value).matches();
    }

    public static boolean looksNumericStart(String text) {
        String value = norm(text);
        if (value.isEmpty()) {
            return false;
        }
        char first = value.charAt(0);
        return first == '%' || (first >= '0' && first <= '9');
    }

    /** «259» + «678.05» — один разряд тысяч, не две суммы. */
    public static boolean isThousandsContinuation(String current, String next) {
        String head = norm(current);
        String tail = norm(next);
        if (head.isEmpty() || tail.isEmpty() || !THOUSANDS_TAIL.matcher(tail).matches()) {
            return false;
        }
        if (head.contains("%") || tail.contains("%")) {
            return false;
        }
        if (head.contains(".") || head.contains(",")) {
            return false;
        }
        String[] parts = head.split(" ");
        String last = parts[parts.length - 1];
        return last.matches("\\d{1,3}");
    }

    private static String norm(String text) {
        return text == null ? "" : text.replace('\u00a0', ' ').replace('\u202f', ' ').trim();
    }
}
