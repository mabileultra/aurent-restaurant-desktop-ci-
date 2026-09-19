package com.pos.pharmacy.importing.spreadsheet.parser;

/** Ячейка HTML-таблицы Excel-экспорта до разворота span. */
public record HtmlExcelCell(String text, int colspan, int rowspan) {
}
