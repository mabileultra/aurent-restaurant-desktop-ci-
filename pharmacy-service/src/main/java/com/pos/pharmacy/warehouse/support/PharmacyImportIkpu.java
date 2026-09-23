package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.importing.spreadsheet.parser.ExcelBarcodeText;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ИКПУ/МХИК из ячейки Didox: «06111… - Трусы…» → код;
 * Excel {@code 3,0044E+15} → 17 цифр (ведущий 0 Excel часто съедает).
 */
public final class PharmacyImportIkpu {

    private static final Pattern CODE = Pattern.compile("\\d{14,17}");

    private PharmacyImportIkpu() {}

    public static String code(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        // Сначала sci: иначе regex берёт кусок мантиссы («0044…») без порядка величины.
        if (ExcelBarcodeText.looksScientific(raw)) {
            String expanded = ExcelBarcodeText.normalize(raw);
            String digits = expanded == null ? "" : expanded.replaceAll("\\D", "");
            if (digits.length() >= 14 && digits.length() <= 17) {
                return pad17(digits);
            }
            return null;
        }
        String compact = raw.replaceAll("\\s+", "");
        Matcher matcher = CODE.matcher(compact);
        if (matcher.find()) {
            return pad17(matcher.group());
        }
        matcher = CODE.matcher(raw);
        return matcher.find() ? pad17(matcher.group()) : null;
    }

    /** Тасниф требует ровно 17 цифр; короткие коды дополняем нулями слева. */
    static String pad17(String digits) {
        if (digits == null || digits.isEmpty()) {
            return null;
        }
        if (digits.length() == 17) {
            return digits;
        }
        if (digits.length() > 17) {
            return digits.substring(0, 17);
        }
        return "0".repeat(17 - digits.length()) + digits;
    }
}
