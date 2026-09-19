package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Режет «ZA4485 dona» / «010726do» на серию и единицу. */
public final class PdfBatchUnitRunSplitter {

    private static final Pattern GLUED = Pattern.compile(
        "(?iu)^(?<batch>[A-Za-zА-Яа-яЁё]{1,6}[\\s-]?\\d{2,8}|\\d{4,8})\\s*"
            + "(?<unit>dona|do|шт|sht|pc|pcs|quti|kg|g|ml|l|amp|fl|flakon|upak|упак)$"
    );

    private PdfBatchUnitRunSplitter() {
    }

    public static List<PdfTextRun> split(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return run == null ? List.of() : List.of(run);
        }
        String text = run.text().trim();
        Matcher matcher = GLUED.matcher(text);
        if (!matcher.matches()) {
            return List.of(run);
        }
        String batch = matcher.group("batch").trim();
        String unit = matcher.group("unit").trim();
        if (batch.isEmpty() || unit.isEmpty()) {
            return List.of(run);
        }
        int cut = matcher.start("unit");
        float width = Math.max(run.x1() - run.x0(), 1f);
        int len = Math.max(text.length(), 1);
        float mid = run.x0() + width * cut / len;
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
