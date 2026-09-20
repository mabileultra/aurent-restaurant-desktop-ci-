package com.pos.pharmacy.importing.spreadsheet.parser;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Excel: 4,78002E+12 / 4.78002E+12 → цифры штрихкода. */
public final class ExcelBarcodeText {

    private static final Pattern SCI = Pattern.compile(
        "^\\s*([+-]?\\d+[.,]?\\d*)\\s*[Ee][+]\\s*(\\d+)\\s*$"
    );

    private ExcelBarcodeText() {}

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String text = raw.trim().replace('\u00a0', ' ').replace('\u202f', ' ');
        if (text.isEmpty()) {
            return "";
        }
        Matcher sci = SCI.matcher(text);
        if (sci.matches()) {
            String expanded = expandScientific(sci.group(1), sci.group(2));
            if (!expanded.isEmpty()) {
                return expanded;
            }
        }
        String digits = text.replaceAll("[^0-9]", "");
        if (digits.length() >= 8 && digits.length() <= 18) {
            return digits;
        }
        return text;
    }

    public static boolean looksScientific(String raw) {
        if (raw == null) {
            return false;
        }
        String upper = raw.trim().toUpperCase(java.util.Locale.ROOT);
        return upper.contains("E+") || upper.contains("E-");
    }

    private static String expandScientific(String mantissa, String expRaw) {
        try {
            String normalized = mantissa.replace(',', '.');
            int exp = Integer.parseInt(expRaw);
            BigDecimal value = new BigDecimal(normalized).scaleByPowerOfTen(exp);
            return value.toPlainString().replaceAll("[^0-9]", "");
        } catch (RuntimeException ex) {
            return "";
        }
    }
}
