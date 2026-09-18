package com.pos.spreadsheet.parser.pdf;

/** Один глиф/фрагмент текста PDF с координатами на странице. */
public record PdfTextToken(int page, float x0, float x1, float y, String text) {

    public float midX() {
        return (x0 + x1) / 2f;
    }
}
