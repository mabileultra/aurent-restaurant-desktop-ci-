package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceMxik;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Чистит Excel-ячейку Didox без вставки колонок: origin-хвост и второй MXIK. */
public final class DidoxSpreadsheetCellCleaner {

    private static final Pattern ORIGIN_TAIL = Pattern.compile(
        "(?iu)(?<value>.*?)\\s+(?<origin>олди[\\s-]?сотди|oldi[\\s-]?sotdi)\\s*$"
    );
    private static final Pattern MXIK = Pattern.compile("\\d{14,17}");

    private DidoxSpreadsheetCellCleaner() {}

    public static List<List<String>> apply(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            return List.of();
        }
        List<List<String>> out = new ArrayList<>(grid.size());
        for (List<String> row : grid) {
            List<String> cleaned = new ArrayList<>(row.size());
            for (String cell : row) {
                cleaned.add(clean(cell));
            }
            out.add(cleaned);
        }
        return out;
    }

    public static String clean(String cell) {
        if (cell == null || cell.isBlank()) {
            return cell == null ? "" : cell;
        }
        return firstMxikSegment(stripOrigin(cell.trim()));
    }

    static String stripOrigin(String text) {
        Matcher matcher = ORIGIN_TAIL.matcher(text);
        if (!matcher.matches()) {
            return text;
        }
        String value = matcher.group("value").trim();
        return value.isEmpty() ? text : value;
    }

    static String firstMxikSegment(String text) {
        Matcher matcher = MXIK.matcher(text);
        if (!matcher.find()) {
            return text;
        }
        int firstEnd = matcher.end();
        if (!matcher.find()) {
            return text;
        }
        String first = DidoxInvoiceMxik.first(text);
        int secondStart = matcher.start();
        if (first == null || secondStart <= firstEnd) {
            return text;
        }
        return text.substring(0, secondStart).trim();
    }
}
