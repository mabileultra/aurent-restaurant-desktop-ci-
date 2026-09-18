package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;

/** Запасной разбор: каждая визуальная строка → ячейки по зазорам, без полос Didox. */
public final class PdfGapGridBuilder {

    private PdfGapGridBuilder() {
    }

    public static List<List<String>> toGrid(List<PdfVisualLine> lines) {
        List<List<String>> grid = new ArrayList<>();
        for (PdfVisualLine line : lines) {
            List<String> cells = new ArrayList<>();
            for (PdfTextRun run : line.runs()) {
                if (run.text() != null && !run.text().isBlank()) {
                    cells.add(run.text());
                }
            }
            if (!cells.isEmpty()) {
                grid.add(cells);
            }
        }
        return grid;
    }
}
