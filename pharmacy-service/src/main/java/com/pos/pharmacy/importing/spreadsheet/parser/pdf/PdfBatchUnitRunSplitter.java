package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Режет «ZA4485 dona» / «UQT24112 dona (tabletka) qadoq=10» на серию и единицу. */
public final class PdfBatchUnitRunSplitter {

    private PdfBatchUnitRunSplitter() {
    }

    public static List<PdfTextRun> split(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return run == null ? List.of() : List.of(run);
        }
        String text = run.text().trim();
        Optional<PdfBatchUnitCut.Parts> cut = PdfBatchUnitCut.split(text);
        if (cut.isEmpty()) {
            return List.of(run);
        }
        String batch = cut.get().series();
        String unit = cut.get().unit();
        float width = Math.max(run.x1() - run.x0(), 1f);
        int len = Math.max(text.length(), 1);
        float mid = run.x0() + width * Math.max(batch.length(), 1) / len;
        return List.of(
            new PdfTextRun(run.page(), run.x0(), Math.max(mid, run.x0() + 0.5f), run.y(), batch),
            new PdfTextRun(run.page(), mid, run.x1(), run.y(), unit)
        );
    }

    public static List<PdfTextRun> splitAll(List<PdfTextRun> runs) {
        if (runs == null || runs.isEmpty()) {
            return List.of();
        }
        List<PdfTextRun> out = new ArrayList<>();
        for (PdfTextRun run : runs) {
            out.addAll(split(run));
        }
        return List.copyOf(out);
    }
}
