package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Серия и «ўлчов» в одной ячейке Didox → колонка «Серия» и следующая. */
public final class DidoxInvoiceSeriesUnitSeparator {

    private DidoxInvoiceSeriesUnitSeparator() {
    }

    public static List<List<String>> apply(List<String> header, List<List<String>> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        int series = seriesIndex(header);
        if (series < 0) {
            return List.copyOf(rows);
        }
        int unit = series + 1;
        List<List<String>> out = new ArrayList<>(rows.size());
        for (List<String> row : rows) {
            out.add(separate(row, series, unit));
        }
        return List.copyOf(out);
    }

    static int seriesIndex(List<String> header) {
        if (header == null) {
            return -1;
        }
        for (int i = 0; i < header.size(); i++) {
            String text = header.get(i) == null ? "" : header.get(i).toLowerCase(Locale.ROOT);
            if (text.contains("серия") || text.contains("seriya") || text.contains("seria")
                || text.contains("series") || text.contains("партия")) {
                return i;
            }
        }
        return -1;
    }

    private static List<String> separate(List<String> row, int series, int unit) {
        if (row == null || series >= row.size()) {
            return row == null ? List.of() : List.copyOf(row);
        }
        Optional<PdfBatchUnitCut.Parts> cut = PdfBatchUnitCut.split(row.get(series));
        if (cut.isEmpty()) {
            return List.copyOf(row);
        }
        List<String> next = new ArrayList<>(row);
        next.set(series, cut.get().series());
        if (unit < next.size() && (next.get(unit) == null || next.get(unit).isBlank())) {
            next.set(unit, cut.get().unit());
        }
        return List.copyOf(next);
    }
}
