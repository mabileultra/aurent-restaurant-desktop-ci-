package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Режет «Маркировкаланган 03004…» и два MXIK в одном слове.
 */
public final class PdfIkpuRunSplitter {

    private static final Pattern MXIK = Pattern.compile("\\d{14,17}");
    private static final Pattern FLAG = Pattern.compile(
        "(?iu)^(маркировкаланган|markirovkalangan|маркированн\\w*)\\s+"
    );

    private PdfIkpuRunSplitter() {}

    public static List<PdfTextRun> split(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return run == null ? List.of() : List.of(run);
        }
        String text = run.text().trim();
        List<Part> parts = parts(text);
        if (parts.size() <= 1) {
            return List.of(run);
        }
        return distribute(run, text, parts);
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

    private static List<Part> parts(String text) {
        List<Integer> cuts = new ArrayList<>();
        cuts.add(0);
        Matcher flag = FLAG.matcher(text);
        if (flag.find() && flag.end() < text.length()) {
            cuts.add(flag.end());
        }
        Matcher mxik = MXIK.matcher(text);
        boolean first = true;
        while (mxik.find()) {
            if (!first && mxik.start() > 0 && !cuts.contains(mxik.start())) {
                cuts.add(mxik.start());
            }
            first = false;
        }
        cuts.sort(Integer::compareTo);
        List<Part> parts = new ArrayList<>();
        for (int i = 0; i < cuts.size(); i++) {
            int start = cuts.get(i);
            int end = i + 1 < cuts.size() ? cuts.get(i + 1) : text.length();
            String piece = text.substring(start, end).trim();
            if (!piece.isEmpty()) {
                parts.add(new Part(start, end, piece));
            }
        }
        return parts;
    }

    private static List<PdfTextRun> distribute(PdfTextRun run, String text, List<Part> parts) {
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

    private record Part(int start, int end, String text) {}
}
