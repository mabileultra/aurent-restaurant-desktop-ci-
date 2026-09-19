package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Режет «UQT24112 dona…qadoq=10» на серию и единицу. */
public final class PdfBatchUnitCut {

    private static final Pattern PREFIX = Pattern.compile(
        "^(?<batch>" + PdfBatchSeriesLook.SERIES_CORE + "|\\d{2,3})\\s*(?<rest>.+)$"
    );

    private PdfBatchUnitCut() {
    }

    public static Optional<Parts> split(String raw) {
        if (raw == null || raw.isBlank() || PdfNumericAtom.looksComplete(raw.trim())) {
            return Optional.empty();
        }
        String text = raw.trim();
        Optional<Parts> prefix = fromPrefix(text);
        if (prefix.isPresent()) {
            return prefix;
        }
        return fromEmbedded(text);
    }

    private static Optional<Parts> fromPrefix(String text) {
        Matcher matcher = PREFIX.matcher(text);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        String batch = matcher.group("batch").trim();
        String rest = matcher.group("rest").trim();
        if (batch.isEmpty() || rest.isEmpty() || !PdfBatchSeriesLook.hasUnitWord(rest)) {
            return Optional.empty();
        }
        if (batch.chars().allMatch(Character::isDigit) && batch.length() <= 3
            && !rest.toLowerCase().startsWith("dona") && !rest.toLowerCase().startsWith("do")) {
            return Optional.empty();
        }
        return Optional.of(new Parts(batch, rest, matcher.start("batch"), matcher.end("batch")));
    }

    private static Optional<Parts> fromEmbedded(String text) {
        if (!PdfBatchSeriesLook.hasUnitWord(text)) {
            return Optional.empty();
        }
        Matcher matcher = PdfBatchSeriesLook.seriesAt(text);
        while (matcher.find()) {
            if (PdfBatchSeriesLook.packNoise(text, matcher.start(), matcher.end())) {
                continue;
            }
            String batch = matcher.group().trim();
            String unit = (text.substring(0, matcher.start()) + " " + text.substring(matcher.end()))
                .replaceAll("\\s+", " ")
                .trim();
            if (batch.isEmpty() || unit.isEmpty() || batch.equals(text)) {
                continue;
            }
            return Optional.of(new Parts(batch, unit, matcher.start(), matcher.end()));
        }
        return Optional.empty();
    }

    public record Parts(String series, String unit, int seriesStart, int seriesEnd) {
    }
}
