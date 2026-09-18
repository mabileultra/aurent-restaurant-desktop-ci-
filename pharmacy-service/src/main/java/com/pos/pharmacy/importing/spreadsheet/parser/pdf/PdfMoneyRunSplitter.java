package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Режет склеенные суммы/НДС: «259 678.05 12% 31 033.91» → три ячейки.
 */
public final class PdfMoneyRunSplitter {

    private static final Pattern PART = Pattern.compile(
        "\\d{1,2}(?:[.,]\\d+)?\\s*%"
            + "|\\d{1,3}(?:\\s\\d{3})+(?:[.,]\\d+)?"
            + "|\\d+[.,]\\d{2,5}"
            + "|\\d{4,}"
    );

    private PdfMoneyRunSplitter() {}

    public static List<PdfTextRun> split(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return run == null ? List.of() : List.of(run);
        }
        String text = run.text().trim();
        List<Part> parts = findParts(text);
        if (parts.size() <= 1) {
            return List.of(run);
        }
        float width = Math.max(run.x1() - run.x0(), 1f);
        int len = Math.max(text.length(), 1);
        List<PdfTextRun> out = new ArrayList<>(parts.size());
        for (Part part : parts) {
            float x0 = run.x0() + width * part.start / len;
            float x1 = run.x0() + width * part.end / len;
            out.add(new PdfTextRun(run.page(), x0, Math.max(x1, x0 + 0.5f), run.y(), part.text));
        }
        return out;
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

    private static List<Part> findParts(String text) {
        Matcher matcher = PART.matcher(text);
        List<Part> parts = new ArrayList<>();
        while (matcher.find()) {
            parts.add(new Part(matcher.start(), matcher.end(), matcher.group().trim()));
        }
        return parts;
    }

    private record Part(int start, int end, String text) {}
}
