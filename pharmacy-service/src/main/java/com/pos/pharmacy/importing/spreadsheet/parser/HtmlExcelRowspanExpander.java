package com.pos.pharmacy.importing.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Разворачивает rowspan HTML-таблицы в плоскую сетку колонок. */
public final class HtmlExcelRowspanExpander {

    private HtmlExcelRowspanExpander() {}

    public static List<List<String>> expand(List<List<HtmlExcelCell>> source) {
        if (source == null || source.isEmpty()) {
            return List.of();
        }
        List<Integer> remain = new ArrayList<>();
        List<String> carry = new ArrayList<>();
        List<List<String>> out = new ArrayList<>();
        for (List<HtmlExcelCell> row : source) {
            List<String> cells = new ArrayList<>();
            int col = 0;
            int idx = 0;
            List<HtmlExcelCell> cellsInRow = row == null ? List.of() : row;
            while (idx < cellsInRow.size() || pendingFrom(remain, col)) {
                ensure(remain, carry, col);
                if (remain.get(col) > 0) {
                    cells.add(carry.get(col));
                    remain.set(col, remain.get(col) - 1);
                    col++;
                    continue;
                }
                if (idx >= cellsInRow.size()) {
                    break;
                }
                HtmlExcelCell cell = cellsInRow.get(idx++);
                int colspan = Math.max(1, cell.colspan());
                int rowspan = Math.max(1, cell.rowspan());
                for (int i = 0; i < colspan; i++) {
                    ensure(remain, carry, col);
                    String text = i == 0 ? nullToEmpty(cell.text()) : "";
                    cells.add(text);
                    if (rowspan > 1) {
                        remain.set(col, rowspan - 1);
                        carry.set(col, text);
                    }
                    col++;
                }
            }
            if (cells.stream().anyMatch(StringUtils::hasText)) {
                out.add(cells);
            }
        }
        return out;
    }

    private static boolean pendingFrom(List<Integer> remain, int col) {
        for (int i = col; i < remain.size(); i++) {
            if (remain.get(i) > 0) {
                return true;
            }
        }
        return false;
    }

    private static void ensure(List<Integer> remain, List<String> carry, int col) {
        while (remain.size() <= col) {
            remain.add(0);
            carry.add("");
        }
    }

    private static String nullToEmpty(String text) {
        return text == null ? "" : text;
    }
}
