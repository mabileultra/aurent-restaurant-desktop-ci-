package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

/** Слово/ячейка внутри одной визуальной строки: соседние глифы склеены по зазору. */
public record PdfTextRun(int page, float x0, float x1, float y, String text) {

    public float midX() {
        return (x0 + x1) / 2f;
    }
}
