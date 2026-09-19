package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Режет «98980.00 Олди-сотди» на сумму и статус. */
public final class PdfOriginRunSplitter {

    private static final Pattern TAIL = Pattern.compile(
        "(?iu)(?<money>.*?)\\s+(?<origin>олди[\\s-]?сотди|oldi[\\s-]?sotdi)\\s*$"
    );

    private PdfOriginRunSplitter() {}

    public static List<PdfTextRun> split(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return run == null ? List.of() : List.of(run);
        }
        String text = run.text().trim();
        Matcher matcher = TAIL.matcher(text);
        if (!matcher.matches()) {
            return List.of(run);
        }
        String money = matcher.group("money").trim();
        String origin = matcher.group("origin").trim();
        if (money.isEmpty() || !PdfNumericAtom.looksComplete(money)) {
            return List.of(run);
        }
        int cut = matcher.start("origin");
        float width = Math.max(run.x1() - run.x0(), 1f);
        int len = Math.max(text.length(), 1);
        float mid = run.x0() + width * cut / len;
        return List.of(
            new PdfTextRun(run.page(), run.x0(), Math.max(mid, run.x0() + 0.5f), run.y(), money),
            new PdfTextRun(run.page(), mid, run.x1(), run.y(), origin)
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
