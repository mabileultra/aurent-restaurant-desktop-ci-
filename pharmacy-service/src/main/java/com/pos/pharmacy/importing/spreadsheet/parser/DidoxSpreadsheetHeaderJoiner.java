package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceFooterFilter;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceMxik;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceRowNumbers;
import com.pos.pharmacy.importing.spreadsheet.parser.pdf.DidoxInvoiceTextFold;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/** Склеивает 2–3 строки шапки Didox Excel в одну, как PDF HeaderMerger. */
public final class DidoxSpreadsheetHeaderJoiner {

    private DidoxSpreadsheetHeaderJoiner() {}

    public static List<List<String>> apply(List<List<String>> grid) {
        if (grid == null || grid.isEmpty()) {
            return List.of();
        }
        List<List<String>> out = copy(grid);
        for (int i = 0; i < out.size() - 1; i++) {
            if (!isTitle(out.get(i))) {
                continue;
            }
            while (i + 1 < out.size() && isWrap(out.get(i + 1))) {
                joinInto(out.get(i), out.remove(i + 1));
            }
        }
        return out;
    }

    static boolean isTitle(List<String> row) {
        if (isDataOrService(row)) {
            return false;
        }
        String text = DidoxInvoiceTextFold.fold(join(row));
        if (text.contains("маркировкаланган") || text.contains("markirovkalangan")) {
            return false;
        }
        return text.contains("махсулот") || text.contains("mahsulot") || text.contains("наименован")
            || text.contains("маркиров") || text.contains("штрих") || text.contains("идентифи")
            || text.contains("каталог") || text.contains("микдор") || text.contains("miqdor")
            || text.contains("нарх") || text.contains("киймат") || text.contains("ккс")
            || text.contains("qqs") || text.contains("ндс") || text.contains("серия")
            || text.contains("бирлиги") || text.contains("устама") || text.contains("ставка")
            || text.contains("икпу") || text.contains("ikpu") || text.contains("barcode")
            || text.contains("хизматлар") || text.contains("улчов") || text.contains("olchov");
    }

    static boolean isWrap(List<String> row) {
        if (isDataOrService(row) || occupied(row) < 2) {
            return false;
        }
        String text = DidoxInvoiceTextFold.fold(join(row));
        if (text.contains("маркировкаланган") || text.contains("markirovkalangan")) {
            return false;
        }
        if (isTitle(row)) {
            return true;
        }
        return text.contains("коди") || text.contains("kodi")
            || text.contains("номи") || text.contains("nomi")
            || text.contains("ставк") || text.contains("бирлиги")
            || text.contains("сумма") || text.contains("киймат") || text.contains("qiymat");
    }

    private static boolean isDataOrService(List<String> row) {
        if (row == null || row.isEmpty()) {
            return true;
        }
        if (InvoiceGridRowKinds.numericIndexRow(row) || DidoxInvoiceFooterFilter.isFooter(row)) {
            return true;
        }
        if (DidoxInvoiceMxik.first(row) != null) {
            return true;
        }
        String col0 = row.get(0);
        return DidoxInvoiceRowNumbers.leading(col0) != null && occupied(row) >= 3;
    }

    private static void joinInto(List<String> target, List<String> extra) {
        while (target.size() < extra.size()) {
            target.add("");
        }
        for (int i = 0; i < extra.size(); i++) {
            target.set(i, joinCell(target.get(i), extra.get(i)));
        }
    }

    private static String joinCell(String previous, String next) {
        if (!StringUtils.hasText(next)) {
            return previous == null ? "" : previous;
        }
        if (!StringUtils.hasText(previous)) {
            return next.trim();
        }
        String left = previous.trim();
        String right = next.trim();
        if (left.contains(right)) {
            return left;
        }
        return left + " " + right;
    }

    private static int occupied(List<String> row) {
        int n = 0;
        for (String cell : row) {
            if (StringUtils.hasText(cell)) {
                n++;
            }
        }
        return n;
    }

    private static String join(List<String> row) {
        StringBuilder sb = new StringBuilder();
        for (String cell : row) {
            if (StringUtils.hasText(cell)) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(cell);
            }
        }
        return sb.toString();
    }

    private static List<List<String>> copy(List<List<String>> grid) {
        List<List<String>> out = new ArrayList<>(grid.size());
        for (List<String> row : grid) {
            out.add(new ArrayList<>(row));
        }
        return out;
    }
}
