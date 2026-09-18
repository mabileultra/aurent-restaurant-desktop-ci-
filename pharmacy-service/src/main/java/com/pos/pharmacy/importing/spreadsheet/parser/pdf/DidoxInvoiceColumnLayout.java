package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Полосы колонок 1…N по ряду номеров Didox («1 2 3 … 16»).
 */
public final class DidoxInvoiceColumnLayout {

    private static final int MIN_COLUMNS = 8;

    private final List<Band> bands;

    DidoxInvoiceColumnLayout(List<Band> bands) {
        this.bands = List.copyOf(bands);
    }

    public int size() {
        return bands.size();
    }

    Band band(int index) {
        return bands.get(index);
    }

    public int columnOf(float x) {
        if (bands.isEmpty()) {
            return 0;
        }
        if (x < bands.get(0).right) {
            return 0;
        }
        for (Band band : bands) {
            if (x >= band.left && x < band.right) {
                return band.index;
            }
        }
        return bands.size() - 1;
    }

    public int columnOfRun(PdfTextRun run) {
        return DidoxInvoiceBandAssigner.column(this, run);
    }

    public List<String> cells(PdfVisualLine line) {
        String[] values = new String[size()];
        int lastMoney = -1;
        for (PdfTextRun run : line.runs()) {
            if (run.text() == null || run.text().isBlank()) {
                continue;
            }
            int col = DidoxInvoiceMoneyColumnAdvance.column(this, run, lastMoney);
            if (PdfNumericAtom.looksComplete(run.text())) {
                lastMoney = col;
            }
            values[col] = join(values[col], run.text());
        }
        List<String> cells = new ArrayList<>(size());
        for (int i = 0; i < values.length; i++) {
            cells.add(values[i] == null ? "" : values[i]);
        }
        return cells;
    }

    public static Optional<NumberedHeader> find(List<PdfVisualLine> lines) {
        if (lines == null || lines.isEmpty()) {
            return Optional.empty();
        }
        for (int i = 0; i < lines.size(); i++) {
            Map<Integer, Float> centers = readCenters(lines.get(i));
            int count = consecutiveCount(centers);
            if (count >= MIN_COLUMNS) {
                Map<Integer, Float> trimmed = trimToConsecutive(centers, count);
                return Optional.of(new NumberedHeader(i, lines.get(i), count, trimmed));
            }
        }
        return Optional.empty();
    }

    public static boolean isNumberedHeader(PdfVisualLine line) {
        return consecutiveCount(readCenters(line)) >= MIN_COLUMNS;
    }

    public static DidoxInvoiceColumnLayout from(NumberedHeader header) {
        Map<Integer, Float> centers = header.centers();
        int n = header.columnCount();
        List<Band> bands = new ArrayList<>(n);
        for (int i = 1; i <= n; i++) {
            float center = centers.get(i);
            float left;
            float right;
            if (i == 1) {
                float step = centers.get(2) - center;
                left = Math.min(0f, center - step / 2f);
            } else {
                left = (centers.get(i - 1) + center) / 2f;
            }
            if (i == n) {
                float step = center - centers.get(i - 1);
                right = center + Math.max(step, 24f);
            } else {
                right = (center + centers.get(i + 1)) / 2f;
            }
            bands.add(new Band(i - 1, left, right));
        }
        return new DidoxInvoiceColumnLayout(bands);
    }

    static Map<Integer, Float> readCenters(PdfVisualLine line) {
        Map<Integer, Float> centers = new LinkedHashMap<>();
        for (PdfTextRun run : line.runs()) {
            for (DidoxColumnIndexSplitter.IndexMark mark : DidoxColumnIndexSplitter.marks(run)) {
                centers.putIfAbsent(mark.number(), mark.midX());
            }
        }
        return centers;
    }

    private static int consecutiveCount(Map<Integer, Float> centers) {
        int n = 0;
        while (centers.containsKey(n + 1)) {
            n++;
        }
        return n;
    }

    private static Map<Integer, Float> trimToConsecutive(Map<Integer, Float> centers, int count) {
        Map<Integer, Float> trimmed = new LinkedHashMap<>();
        for (int i = 1; i <= count; i++) {
            trimmed.put(i, centers.get(i));
        }
        return trimmed;
    }

    static String join(String previous, String next) {
        if (next == null || next.isBlank()) {
            return previous == null ? "" : previous;
        }
        if (previous == null || previous.isBlank()) {
            return next;
        }
        return previous + " " + next;
    }

    public record NumberedHeader(
        int lineIndex,
        PdfVisualLine line,
        int columnCount,
        Map<Integer, Float> centers
    ) {
    }

    record Band(int index, float left, float right) {
    }
}
