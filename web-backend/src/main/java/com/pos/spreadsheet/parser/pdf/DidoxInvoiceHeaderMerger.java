package com.pos.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Склеивает перенесённые заголовки Didox над рядом «1 2 3 … 16» в одну строку. */
public final class DidoxInvoiceHeaderMerger {

    private static final int MAX_HEADER_LINES = 8;

    private DidoxInvoiceHeaderMerger() {
    }

    public static MergedHeader merge(List<PdfVisualLine> lines, DidoxInvoiceColumnLayout.NumberedHeader numbered,
                                     DidoxInvoiceColumnLayout layout) {
        int lastTitle = numbered.lineIndex() - 1;
        int firstTitle = numbered.lineIndex();
        for (int i = lastTitle; i >= Math.max(0, numbered.lineIndex() - MAX_HEADER_LINES); i--) {
            PdfVisualLine line = lines.get(i);
            if (isTitleLine(line, layout) || isHeaderWrapLine(line, layout)) {
                firstTitle = i;
            } else if (firstTitle < numbered.lineIndex()) {
                break;
            }
        }
        List<String> cells = emptyCells(layout.size());
        if (firstTitle < numbered.lineIndex()) {
            for (int i = firstTitle; i <= lastTitle; i++) {
                append(cells, layout.cells(lines.get(i)));
            }
        }
        appendNonIndexRuns(cells, numbered.line(), layout);
        return new MergedHeader(Math.min(firstTitle, numbered.lineIndex()), cells);
    }

    static boolean isTitleLine(PdfVisualLine line, DidoxInvoiceColumnLayout layout) {
        if (DidoxInvoiceColumnLayout.isNumberedHeader(line)) {
            return false;
        }
        String text = line.joined().toLowerCase(Locale.ROOT);
        if (text.contains("харид даража") || text.contains("harid daraja")) {
            return false;
        }
        return containsTitleKeyword(text);
    }

    private static boolean isHeaderWrapLine(PdfVisualLine line, DidoxInvoiceColumnLayout layout) {
        if (DidoxInvoiceColumnLayout.isNumberedHeader(line) || isTitleLine(line, layout)) {
            return false;
        }
        String text = line.joined().toLowerCase(Locale.ROOT);
        if (text.contains("харид даража") || text.contains("harid daraja")) {
            return false;
        }
        return occupiedBands(line, layout) >= 3;
    }

    private static boolean containsTitleKeyword(String text) {
        return text.contains("маҳсулот") || text.contains("mahsulot") || text.contains("наименован")
            || text.contains("маркиров") || text.contains("штрих") || text.contains("идентифи")
            || text.contains("каталог") || text.contains("миқдор") || text.contains("miqdor")
            || text.contains("нарх") || text.contains("қиймат") || text.contains("ққс")
            || text.contains("qqs") || text.contains("ндс") || text.contains("серия")
            || text.contains("бирлиги") || text.contains("устама") || text.contains("ставка")
            || text.contains("икпу") || text.contains("ikpu") || text.contains("barcode")
            || text.contains("хизматлар") || text.contains("ўлчов") || text.contains("olchov")
            || text.contains("nomi") || text.contains("narx");
    }

    private static int occupiedBands(PdfVisualLine line, DidoxInvoiceColumnLayout layout) {
        boolean[] used = new boolean[layout.size()];
        int n = 0;
        for (PdfTextRun run : line.runs()) {
            if (run.text() == null || run.text().isBlank()) {
                continue;
            }
            int col = layout.columnOfRun(run);
            if (!used[col]) {
                used[col] = true;
                n++;
            }
        }
        return n;
    }

    private static void appendNonIndexRuns(List<String> cells, PdfVisualLine numberedLine,
                                           DidoxInvoiceColumnLayout layout) {
        for (PdfTextRun run : numberedLine.runs()) {
            String text = run.text();
            if (text == null || text.isBlank() || text.matches("^(?:[1-9]|1[0-9]|20)$")) {
                continue;
            }
            int col = layout.columnOfRun(run);
            cells.set(col, DidoxInvoiceColumnLayout.join(cells.get(col), text));
        }
    }

    static void append(List<String> target, List<String> extra) {
        int n = Math.max(target.size(), extra.size());
        while (target.size() < n) {
            target.add("");
        }
        for (int i = 0; i < extra.size(); i++) {
            target.set(i, DidoxInvoiceColumnLayout.join(target.get(i), extra.get(i)));
        }
    }

    private static List<String> emptyCells(int size) {
        List<String> cells = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            cells.add("");
        }
        return cells;
    }

    public record MergedHeader(int firstLineIndex, List<String> cells) {
    }
}
