package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** Достаёт номера колонок 1…16 даже если PDF склеил «123…16» в одно слово. */
public final class DidoxColumnIndexSplitter {

    private static final Pattern INDEX = Pattern.compile("^(?:[1-9]|1[0-9]|20)$");

    private DidoxColumnIndexSplitter() {}

    public static List<IndexMark> marks(PdfTextRun run) {
        if (run == null || run.text() == null || run.text().isBlank()) {
            return List.of();
        }
        String text = run.text().trim();
        if (INDEX.matcher(text).matches()) {
            return List.of(new IndexMark(Integer.parseInt(text), run.midX()));
        }
        String[] spaced = text.split("\\s+");
        if (spaced.length >= 8 && allIndex(spaced)) {
            return distribute(run, parseAll(spaced));
        }
        String digits = text.replaceAll("\\s+", "");
        if (!digits.matches("\\d{8,}")) {
            return List.of();
        }
        List<Integer> sequential = greedySequential(digits);
        if (sequential.size() < 8) {
            return List.of();
        }
        return distribute(run, sequential);
    }

    private static boolean allIndex(String[] parts) {
        for (String part : parts) {
            if (!INDEX.matcher(part).matches()) {
                return false;
            }
        }
        return true;
    }

    private static List<Integer> parseAll(String[] parts) {
        List<Integer> values = new ArrayList<>(parts.length);
        for (String part : parts) {
            values.add(Integer.parseInt(part));
        }
        return values;
    }

    static List<Integer> greedySequential(String digits) {
        List<Integer> values = new ArrayList<>();
        int expected = 1;
        int i = 0;
        while (i < digits.length()) {
            String want = String.valueOf(expected);
            if (!digits.startsWith(want, i)) {
                break;
            }
            values.add(expected);
            i += want.length();
            expected++;
            if (expected > 20) {
                break;
            }
        }
        return values;
    }

    private static List<IndexMark> distribute(PdfTextRun run, List<Integer> numbers) {
        float width = Math.max(run.x1() - run.x0(), 1f);
        int n = numbers.size();
        List<IndexMark> marks = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            float x = run.x0() + width * (i + 0.5f) / n;
            marks.add(new IndexMark(numbers.get(i), x));
        }
        return marks;
    }

    public record IndexMark(int number, float midX) {}
}
