package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Режет «… Pvt 8908018944007» — штрихкод не должен жить в МХИК. */
public final class PdfBarcodeRunSplitter {

    private static final Pattern EAN13 = Pattern.compile("(?<!\\d)\\d{13}(?!\\d)");

    private PdfBarcodeRunSplitter() {
    }

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
        Matcher matcher = EAN13.matcher(text);
        if (!matcher.find() || DidoxInvoiceMxik.first(matcher.group()) != null) {
            return List.of(new Part(0, text.length(), text));
        }
        List<Integer> cuts = new ArrayList<>();
        cuts.add(0);
        if (matcher.start() > 0) {
            cuts.add(matcher.start());
        }
        if (matcher.end() < text.length()) {
            cuts.add(matcher.end());
        }
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

    private record Part(int start, int end, String text) {
    }
}
