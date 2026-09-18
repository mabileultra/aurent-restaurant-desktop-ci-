package com.pos.pharmacy.importing.spreadsheet.parser;

import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

/** Служебные строки сетки счёт-фактуры: ряд номеров 1…16 и повтор шапки на следующей странице. */
public final class InvoiceGridRowKinds {

    private InvoiceGridRowKinds() {
    }

    public static boolean numericIndexRow(List<String> row) {
        int numeric = 0;
        int nonEmpty = 0;
        for (String cell : row) {
            if (!StringUtils.hasText(cell)) {
                continue;
            }
            nonEmpty++;
            if (cell.trim().matches("\\d{1,2}")) {
                numeric++;
            }
        }
        return nonEmpty >= 5 && numeric == nonEmpty;
    }

    public static boolean repeatedProductHeader(List<String> row) {
        String joined = joinLower(row);
        if (!(joined.contains("маҳсулот") || joined.contains("mahsulot") || joined.contains("наименован"))) {
            return false;
        }
        return joined.contains("нарх") || joined.contains("миқдор") || joined.contains("miqdor")
            || joined.contains("маркиров") || joined.contains("штрих");
    }

    private static String joinLower(List<String> row) {
        StringBuilder sb = new StringBuilder();
        for (String cell : row) {
            if (cell != null) {
                sb.append(cell).append(' ');
            }
        }
        return sb.toString().toLowerCase(Locale.ROOT);
    }
}
