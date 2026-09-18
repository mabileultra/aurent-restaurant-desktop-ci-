package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Горизонтальная визуальная строка PDF (глифы с близким Y). */
public final class PdfVisualLine {

    private final float y;
    private final List<PdfTextToken> tokens = new ArrayList<>();
    private List<PdfTextRun> runs;

    public PdfVisualLine(float y) {
        this.y = y;
    }

    public float y() {
        return y;
    }

    public void add(PdfTextToken token) {
        tokens.add(token);
        runs = null;
    }

    public List<PdfTextToken> tokens() {
        return tokens;
    }

    public List<PdfTextRun> runs() {
        if (runs == null) {
            runs = PdfLineRunMerger.merge(tokens);
        }
        return runs;
    }

    public String joined() {
        return runs().stream()
            .map(PdfTextRun::text)
            .filter(text -> text != null && !text.isBlank())
            .collect(Collectors.joining(" "));
    }
}
