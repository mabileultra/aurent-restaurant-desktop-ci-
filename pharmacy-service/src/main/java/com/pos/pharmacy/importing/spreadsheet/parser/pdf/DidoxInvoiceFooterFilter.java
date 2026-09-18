package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.List;
import java.util.Locale;

/** Подвал Didox hisob-faktura: жами, подписи, «имконияти» — не товар. */
public final class DidoxInvoiceFooterFilter {

    private DidoxInvoiceFooterFilter() {}

    public static boolean isFooter(List<String> cells) {
        return isFooterText(join(cells));
    }

    public static boolean isFooterText(String raw) {
        String text = raw == null ? "" : raw.toLowerCase(Locale.ROOT).trim();
        if (text.isEmpty()) {
            return false;
        }
        return text.contains("жами") || text.contains("jami") || text.contains("итого")
            || text.contains("имконият") || text.contains("imkoniyat")
            || text.contains("бекитиш") || text.contains("bekitish")
            || ((text.contains("мфо") || text.contains("mfo")) && text.length() > 12)
            || text.contains("qr-kod") || text.contains("qr код")
            || (text.contains("банк") && text.length() > 24 && !text.contains("маҳсулот") && !text.contains("mahsulot"));
    }

    private static String join(List<String> cells) {
        if (cells == null || cells.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (String cell : cells) {
            if (cell != null && !cell.isBlank()) {
                if (sb.length() > 0) {
                    sb.append(' ');
                }
                sb.append(cell);
            }
        }
        return sb.toString();
    }
}
