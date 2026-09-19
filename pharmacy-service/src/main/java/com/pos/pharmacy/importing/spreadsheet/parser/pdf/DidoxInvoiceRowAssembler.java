package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Собирает товарные строки: переносы внутри ячейки дописываются к текущему товару,
 * новый № в первой колонке начинает следующую позицию.
 */
public final class DidoxInvoiceRowAssembler {

    private DidoxInvoiceRowAssembler() {
    }

    public static List<List<String>> assemble(List<PdfVisualLine> lines, int startIndex,
                                             DidoxInvoiceColumnLayout layout) {
        List<List<String>> rows = new ArrayList<>();
        List<String> current = null;
        List<String> pending = null;
        int lastNumber = 0;
        for (int i = startIndex; i < lines.size(); i++) {
            PdfVisualLine line = lines.get(i);
            if (DidoxInvoiceColumnLayout.isNumberedHeader(line)) {
                continue;
            }
            if (DidoxInvoiceFooterFilter.isSignature(line.joined())) {
                break;
            }
            if (isChrome(line.joined()) || DidoxInvoiceFooterFilter.isFooterText(line.joined())) {
                continue;
            }
            List<String> cells = layout.cells(line);
            if (isEmpty(cells) || DidoxInvoiceFooterFilter.isFooter(cells)) {
                continue;
            }
            if (DidoxInvoiceFooterFilter.isSignature(cells)) {
                break;
            }
            if (isRepeatedHeader(line, cells)) {
                continue;
            }
            Integer number = DidoxInvoiceRowNumbers.leading(cells.isEmpty() ? "" : cells.get(0));
            if (number != null && DidoxInvoiceRowSequence.isNext(lastNumber, number) && isNewProduct(cells)) {
                if (current != null) {
                    rows.add(current);
                }
                current = DidoxInvoiceLeadMerge.intoProduct(pending, cells);
                pending = null;
                lastNumber = number;
                continue;
            }
            if (DidoxInvoiceLeadLook.ofNextProduct(lines, i, lastNumber, layout)) {
                if (current == null) {
                    pending = DidoxInvoiceLeadMerge.join(pending, cells);
                } else {
                    pending = DidoxInvoiceLeadMerge.join(pending, DidoxInvoiceLeadMerge.withoutOrigin(cells));
                    DidoxInvoiceHeaderMerger.append(current, DidoxInvoiceLeadMerge.originOnly(cells));
                }
                continue;
            }
            if (current != null && !isPageNumberOnly(cells)) {
                DidoxInvoiceHeaderMerger.append(current, cells);
            } else if (current == null) {
                pending = DidoxInvoiceLeadMerge.join(pending, cells);
            }
        }
        if (current != null) {
            rows.add(current);
        }
        return rows;
    }

    private static boolean isRepeatedHeader(PdfVisualLine line, List<String> cells) {
        if (isNewProduct(cells)) {
            return false;
        }
        int occupied = 0;
        for (String cell : cells) {
            if (cell != null && !cell.isBlank()) {
                occupied++;
            }
        }
        return occupied >= 2 && DidoxInvoiceHeaderMerger.isTitleLine(line, null);
    }

    static boolean isNewProduct(List<String> cells) {
        if (cells.isEmpty()) {
            return false;
        }
        Integer number = DidoxInvoiceRowNumbers.leading(cells.get(0));
        if (number == null) {
            return false;
        }
        return hasNameOrMore(cells);
    }

    private static boolean hasNameOrMore(List<String> cells) {
        String first = cells.get(0) == null ? "" : cells.get(0).trim();
        Integer number = DidoxInvoiceRowNumbers.leading(first);
        if (number != null && first.length() > String.valueOf(number).length() + 1) {
            return true;
        }
        int occupied = 0;
        for (int i = 0; i < cells.size(); i++) {
            if (cells.get(i) != null && !cells.get(i).isBlank()) {
                occupied++;
            }
        }
        return occupied >= 2;
    }

    private static boolean isPageNumberOnly(List<String> cells) {
        int occupied = 0;
        String only = "";
        for (String cell : cells) {
            if (cell == null || cell.isBlank()) {
                continue;
            }
            occupied++;
            only = cell.trim();
        }
        return occupied == 1 && only.matches("\\d{1,4}");
    }

    private static boolean isEmpty(List<String> cells) {
        for (String cell : cells) {
            if (cell != null && !cell.isBlank()) {
                return false;
            }
        }
        return true;
    }

    private static boolean isChrome(String joined) {
        String text = joined == null ? "" : joined.toLowerCase(Locale.ROOT).trim();
        if (text.isEmpty()) {
            return true;
        }
        return text.equals("стандарт") || text.equals("standard")
            || text.contains("didox.uz") || text.contains("rouming.uz")
            || text.contains("хужжат ид") || text.contains("hujjat id")
            || (text.contains("ҳисоб-фактура") && text.length() < 80)
            || (text.contains("hisob-faktura") && text.length() < 80);
    }
}
