package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Склеивает глифы одной строки в слова: маленький зазор — пробел, большой — новое слово. */
public final class PdfLineRunMerger {

    private PdfLineRunMerger() {
    }

    public static List<PdfTextRun> merge(List<PdfTextToken> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }
        List<PdfTextToken> ordered = new ArrayList<>(tokens);
        ordered.sort(Comparator.comparingDouble(PdfTextToken::x0));

        float avgCharWidth = averageCharWidth(ordered);
        float cellGap = avgCharWidth > 0 ? avgCharWidth * 2.4f : 8f;
        float spaceGap = avgCharWidth > 0 ? avgCharWidth * 0.35f : 1.2f;

        List<PdfTextRun> runs = new ArrayList<>();
        StringBuilder text = new StringBuilder();
        PdfTextToken first = ordered.get(0);
        float runX0 = first.x0();
        float runX1 = first.x1();
        float runY = first.y();
        int runPage = first.page();
        float lastX1 = first.x0();

        for (PdfTextToken token : ordered) {
            float gap = token.x0() - lastX1;
            if (text.length() > 0 && gap > cellGap) {
                runs.add(toRun(runPage, runX0, runX1, runY, text.toString()));
                text.setLength(0);
                runX0 = token.x0();
                runY = token.y();
                runPage = token.page();
            } else if (text.length() > 0 && gap > spaceGap && !token.text().isBlank()
                && text.charAt(text.length() - 1) != ' ') {
                text.append(' ');
            }
            text.append(token.text());
            runX1 = Math.max(runX1, token.x1());
            lastX1 = Math.max(lastX1, token.x1());
        }
        if (text.length() > 0) {
            runs.add(toRun(runPage, runX0, runX1, runY, text.toString()));
        }
        return runs;
    }

    private static PdfTextRun toRun(int page, float x0, float x1, float y, String raw) {
        return new PdfTextRun(page, x0, x1, y, normalize(raw));
    }

    static String normalize(String raw) {
        return raw.replace('\u00a0', ' ')
            .replace('\u202f', ' ')
            .replaceAll("\\s+", " ")
            .trim();
    }

    private static float averageCharWidth(List<PdfTextToken> tokens) {
        float sum = 0f;
        int counted = 0;
        for (PdfTextToken token : tokens) {
            if (token.text().isBlank()) {
                continue;
            }
            float w = (token.x1() - token.x0()) / Math.max(token.text().length(), 1);
            if (w > 0.2f) {
                sum += w;
                counted++;
            }
        }
        return counted > 0 ? sum / counted : 0f;
    }
}
