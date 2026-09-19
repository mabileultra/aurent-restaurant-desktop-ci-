package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.List;

/** Подвал Didox hisob-faktura: жами, подписи, «имконияти» — не товар. */
public final class DidoxInvoiceFooterFilter {

    private DidoxInvoiceFooterFilter() {}

    public static boolean isFooter(List<String> cells) {
        return isFooterText(join(cells));
    }

    public static boolean isSignature(List<String> cells) {
        return isSignature(join(cells));
    }

    public static boolean isFooterText(String raw) {
        String text = DidoxInvoiceTextFold.fold(raw).trim();
        if (text.isEmpty()) {
            return false;
        }
        return isTotal(text) || isSignature(text)
            || text.contains("имконият") || text.contains("imkoniyat")
            || ((text.contains("мфо") || text.contains("mfo")) && text.length() > 12)
            || text.contains("qr-kod") || text.contains("qr код")
            || (text.contains("банк") && text.length() > 24 && !text.contains("махсулот") && !text.contains("mahsulot"));
    }

    /** Итог «жами» — не товар, но после него на следующей странице ещё могут быть позиции. */
    public static boolean isTotal(String raw) {
        String text = DidoxInvoiceTextFold.fold(raw);
        return text.contains("жами") || text.contains("jami") || text.contains("итого")
            || text.contains("total");
    }

    /** Подписи в конце фактуры: дальше товаров нет. */
    public static boolean isSignature(String raw) {
        String text = DidoxInvoiceTextFold.fold(raw);
        return text.contains("рахбар") || text.contains("rahbar")
            || text.contains("хисобчи") || text.contains("hisobchi")
            || text.contains("бухгалтер")
            || text.contains("товар берди") || text.contains("tovar berdi")
            || text.contains("юборилган") || text.contains("yuborilgan")
            || text.contains("тасдикланган") || text.contains("tasdiqlangan")
            || text.contains("бекитиш") || text.contains("bekitish")
            || text.contains("имзо") || text.contains("imzo");
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
