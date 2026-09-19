package com.pos.pharmacy.importing.spreadsheet.parser.pdf;

import java.util.ArrayList;
import java.util.List;

/** Склеивает перенос над № с товарной строкой: «Кюпен таб» + «1» → «Кюпен таб». */
public final class DidoxInvoiceLeadMerge {

    private DidoxInvoiceLeadMerge() {
    }

    public static List<String> intoProduct(List<String> pending, List<String> product) {
        if (product == null || product.isEmpty()) {
            return copy(pending);
        }
        if (pending == null || pending.isEmpty()) {
            return copy(product);
        }
        int n = Math.max(pending.size(), product.size());
        List<String> out = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            String lead = i < pending.size() ? pending.get(i) : "";
            String main = i < product.size() ? product.get(i) : "";
            out.add(i == 0 ? mergeName(lead, main) : DidoxInvoiceColumnLayout.join(lead, main));
        }
        return out;
    }

    public static List<String> join(List<String> pending, List<String> extra) {
        if (pending == null || pending.isEmpty()) {
            return copy(extra);
        }
        if (extra == null || extra.isEmpty()) {
            return copy(pending);
        }
        List<String> out = copy(pending);
        DidoxInvoiceHeaderMerger.append(out, extra);
        return out;
    }

    public static List<String> originOnly(List<String> cells) {
        if (cells == null || cells.isEmpty()) {
            return List.of();
        }
        List<String> out = empty(cells.size());
        out.set(cells.size() - 1, cells.get(cells.size() - 1) == null ? "" : cells.get(cells.size() - 1));
        return out;
    }

    public static List<String> withoutOrigin(List<String> cells) {
        if (cells == null || cells.isEmpty()) {
            return List.of();
        }
        List<String> out = copy(cells);
        out.set(out.size() - 1, "");
        return out;
    }

    static String mergeName(String pending, String numbered) {
        String lead = pending == null ? "" : pending.trim();
        String main = numbered == null ? "" : numbered.trim();
        Integer number = DidoxInvoiceRowNumbers.leading(main);
        String rest = number == null ? main : DidoxInvoiceRowNumbers.strip(main);
        return DidoxInvoiceColumnLayout.join(lead, rest);
    }

    private static List<String> copy(List<String> cells) {
        if (cells == null || cells.isEmpty()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(cells);
    }

    private static List<String> empty(int size) {
        List<String> out = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            out.add("");
        }
        return out;
    }
}
