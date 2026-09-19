package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Серия Didox: «UQT24112», не «qadoq=10» и не сумма. */
public final class PdfBatchSeriesLook {

    static final String SERIES_CORE =
        "[A-Za-zА-Яа-яЁё]{1,8}[\\s-]?\\d{2,10}(?:[A-ZА-Я]{1,4})?"
            + "|\\d{4,10}(?:[A-ZА-Я]{1,4})?";

    private static final Pattern SERIES_TOKEN = Pattern.compile(SERIES_CORE);
    private static final Pattern UNIT_WORD = Pattern.compile(
        "(?iu)qadoq|blister|flakon|tabletka|kapsula|shamcha|tuba|упак|upak|quti|"
            + "dona|шт|sht|(?<![a-zа-яё])do(?![a-zа-яё])|pcs?\\b|amp\\b|\\bml\\b|\\bmg\\b"
    );
    private static final Pattern VOLUME = Pattern.compile("(?iu)^\\d{1,4}\\s*(?:ml|mg|g|gr|кг|kg|l)$");

    private PdfBatchSeriesLook() {
    }

    public static boolean hasUnitWord(String raw) {
        return raw != null && UNIT_WORD.matcher(raw).find();
    }

    public static Matcher seriesAt(String text) {
        return SERIES_TOKEN.matcher(text == null ? "" : text);
    }

    public static boolean packNoise(String text, int start, int end) {
        if (text == null || start < 0 || end > text.length() || start >= end) {
            return true;
        }
        String token = text.substring(start, end).trim();
        if (token.isEmpty()) {
            return true;
        }
        if (start > 0 && text.charAt(start - 1) == '=') {
            return true;
        }
        if (VOLUME.matcher(token).matches()) {
            return true;
        }
        return token.chars().allMatch(Character::isDigit) && token.length() <= 3;
    }
}
