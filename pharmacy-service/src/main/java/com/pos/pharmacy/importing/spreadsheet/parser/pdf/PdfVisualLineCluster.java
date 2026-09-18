package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Группирует глифы в визуальные строки по Y (с учётом смещения страниц). */
public final class PdfVisualLineCluster {

    static final float ROW_Y_TOLERANCE = 3.6f;

    private PdfVisualLineCluster() {
    }

    public static List<PdfVisualLine> cluster(List<PdfTextToken> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }
        List<PdfTextToken> ordered = new ArrayList<>(tokens);
        ordered.sort(Comparator.comparingDouble(PdfTextToken::y).thenComparingDouble(PdfTextToken::x0));

        List<LineAcc> accs = new ArrayList<>();
        for (PdfTextToken token : ordered) {
            LineAcc match = findBucket(accs, token.y());
            if (match == null) {
                match = new LineAcc(token.y());
                accs.add(match);
            } else {
                match.absorb(token.y());
            }
            match.tokens.add(token);
        }
        List<PdfVisualLine> lines = new ArrayList<>(accs.size());
        for (LineAcc acc : accs) {
            PdfVisualLine line = new PdfVisualLine(acc.y);
            for (PdfTextToken token : acc.tokens) {
                line.add(token);
            }
            lines.add(line);
        }
        lines.sort(Comparator.comparingDouble(PdfVisualLine::y));
        return lines;
    }

    private static LineAcc findBucket(List<LineAcc> accs, float y) {
        for (int i = accs.size() - 1; i >= 0; i--) {
            LineAcc acc = accs.get(i);
            if (y - acc.y > ROW_Y_TOLERANCE * 3) {
                break;
            }
            if (Math.abs(acc.y - y) <= ROW_Y_TOLERANCE) {
                return acc;
            }
        }
        return null;
    }

    private static final class LineAcc {
        float y;
        int count = 1;
        final List<PdfTextToken> tokens = new ArrayList<>();

        LineAcc(float y) {
            this.y = y;
        }

        void absorb(float nextY) {
            y = (y * count + nextY) / (count + 1);
            count++;
        }
    }
}
