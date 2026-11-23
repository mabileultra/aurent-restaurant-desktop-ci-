package com.pos.spreadsheet.parser;

import java.util.List;
import java.util.Locale;

/** Определение колонок шапки счёт-фактуры (имя, ИКПУ, qty, Нарх, сумма с НДС, ставка). */
final class UzInvoiceColumnMapper {

    private UzInvoiceColumnMapper() {
    }

    static UzInvoiceColumnMap mapColumns(List<String> header) {
        UzInvoiceColumnMap map = new UzInvoiceColumnMap();
        if (header == null || header.isEmpty()) {
            applyDefaults(map);
            return map;
        }
        for (int c = 0; c < header.size(); c++) {
            String h = norm(header.get(c));
            if (h.isEmpty()) {
                continue;
            }
            if (containsAny(h, "маҳсулот номи", "mahsulot nomi", "наименован", "номи (хизмат")) {
                map.name = c;
            } else if (containsAny(h, "идентификация", "икпу", "ikpu", "каталог", "миллий каталог")) {
                map.ikpu = c;
            } else if (containsAny(h, "штрих", "shtrix", "barcode", "ean", "штрихкод")) {
                map.barcode = c;
            } else if (containsAny(h, "ўлчов", "olchov", "ед.", "единица", "бирлиги")) {
                map.unit = c;
            } else if (containsAny(h,
                "миқдор", "miqdor", "колич", "кол-во", "кол во", "количество", "quantity", "qty", "count"
            )) {
                map.qty = c;
            } else if (UzInvoiceLineTotalWithVatHeaders.matches(h)) {
                map.lineTotalWithVat = c;
            } else if (h.equals("нарх") || h.contains("нарҳ")
                || (h.contains("цена") && !h.contains("қиймат") && !h.contains("сумма"))) {
                map.unitPrice = c;
            } else if (isVatRateHeader(h)) {
                map.vatRate = c;
            }
        }
        applyDefaults(map);
        return map;
    }

    /** Ставка ҚҚС/НДС — не «сумма ҚҚС». */
    static boolean isVatRateHeader(String h) {
        if (h == null || h.isEmpty()) {
            return false;
        }
        if (h.contains("сумма") || h.contains("amount") || h.contains("қиймат") || h.contains("qiymat")) {
            return false;
        }
        if (UzInvoiceLineTotalWithVatHeaders.matches(h)) {
            return false;
        }
        if (containsAny(h, "ставка", "rate")) {
            return h.contains("ққс") || h.contains("qqs") || h.contains("ндс") || h.contains("vat")
                || h.contains("ставка");
        }
        return h.equals("ққс") || h.equals("qqs") || h.equals("ндс") || h.equals("vat");
    }

    private static void applyDefaults(UzInvoiceColumnMap map) {
        if (map.name < 0) {
            map.name = 1;
        }
        if (map.ikpu < 0) {
            map.ikpu = 2;
        }
        if (map.unit < 0) {
            map.unit = 3;
        }
        if (map.qty < 0) {
            map.qty = 4;
        }
        if (map.unitPrice < 0) {
            map.unitPrice = 5;
        }
        if (map.vatRate < 0) {
            map.vatRate = 7;
        }
    }

    private static String norm(String s) {
        return s == null ? "" : s.trim().toLowerCase(Locale.ROOT).replace('\n', ' ');
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) {
            if (haystack.contains(n)) {
                return true;
            }
        }
        return false;
    }
}
