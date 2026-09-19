package com.pos.pharmacy.warehouse.support;

import java.util.Locale;
import java.util.Set;

/** Роли колонок импорта аптечного поступления. */
public final class PharmacyImportRoles {

    public static final String SKIP = "SKIP";
    public static final String NAME = "NAME";
    public static final String MANUFACTURER = "MANUFACTURER";
    public static final String COUNTRY = "COUNTRY";
    public static final String QTY = "QTY";
    public static final String BATCH = "BATCH";
    public static final String EXPIRY = "EXPIRY";
    public static final String PURCHASE = "PURCHASE";
    public static final String PURCHASE_WITH_VAT = "PURCHASE_WITH_VAT";
    public static final String VAT_RATE = "VAT_RATE";
    public static final String RETAIL = "RETAIL";
    public static final String BARCODE = "BARCODE";
    public static final String IKPU = "IKPU";
    public static final String UNITS_IN_PACK = "UNITS_IN_PACK";
    public static final String MARK_CODES = "MARK_CODES";
    public static final String PRESCRIPTION = "PRESCRIPTION";

    public static final Set<String> ALL = Set.of(
        SKIP, NAME, MANUFACTURER, COUNTRY, QTY, BATCH, EXPIRY,
        PURCHASE, PURCHASE_WITH_VAT, VAT_RATE, RETAIL, BARCODE, IKPU, UNITS_IN_PACK, MARK_CODES,
        PRESCRIPTION
    );

    private PharmacyImportRoles() {
    }

    public static String guess(String header) {
        String h = header == null ? "" : header.trim().toLowerCase(Locale.ROOT).replace('\n', ' ');
        if (h.isEmpty()) {
            return SKIP;
        }
        if (containsAny(h, "штрих", "barcode", "ean", "штрихкод")) {
            return BARCODE;
        }
        if (containsAny(h, "datamatrix", "data matrix", "киз", "км код", "код км", "codes km")) {
            return MARK_CODES;
        }
        if (containsAny(h, "икпу", "ikpu", "мхик", "mxik", "каталог", "идентификац", "миллий каталог")) {
            return IKPU;
        }
        if (containsAny(h, "маркиров", "markirov")) {
            return SKIP;
        }
        if (containsAny(h, "олди", "oldi-sotdi", "келиб чик", "келиб чиқ")) {
            return SKIP;
        }
        if (containsAny(h, "срок", "годност", "expiry", "годен", "yaroqlilik")) {
            return EXPIRY;
        }
        if (containsAny(h, "серия", "сери", "seriya", "seria", "series", "serial",
            "batch", "партия", "partiya")) {
            return BATCH;
        }
        if (containsAny(h, "производител", "manufacturer", "ishlab chiqaruvchi")) {
            return MANUFACTURER;
        }
        if (containsAny(h, "страна", "country", "davlat")) {
            return COUNTRY;
        }
        if (containsAny(h, "в упаков", "units in pack", "кол-во в упак", "упаковк")) {
            return UNITS_IN_PACK;
        }
        if (containsAny(h, "рознич", "розн", "retail", "chakana", "чакана", "продаж", "сотиш", "sotish", "реализац")
            && !containsAny(h, "сумма", "итого", "summa")) {
            return RETAIL;
        }
        if (containsAny(h, "етказиб", "yetkazib")) {
            return SKIP;
        }
        if (containsAny(h, "бериш усул", "дори восита", "рецептли", "рецептсиз",
            "retseptli", "retseptsiz", "prescription")) {
            return PRESCRIPTION;
        }
        if (containsAny(h, "устама", "ustama", "надбав", "қўшимча", "кушимча", "qoshimcha", "markup")) {
            return SKIP;
        }
        if (containsAny(h, "покупн", "закуп") && containsAny(h, "с ндс", "with vat")) {
            return PURCHASE_WITH_VAT;
        }
        if (containsAny(h, "без ндс", "without vat", "qqssiz", "ққссиз")) {
            return PURCHASE;
        }
        if (containsAny(h, "сотиб олиш", "sotib olish", "йиллик нарх")) {
            return PURCHASE;
        }
        if (containsAny(h, "нарх", "нарҳ") && !containsAny(h, "сотиб", "закуп", "покупн")) {
            return RETAIL;
        }
        if (containsAny(h, "покупн", "закуп", "себестоим", "purchase") || h.equals("цена")) {
            return PURCHASE;
        }
        if (containsAny(h, "ндс", "ққс", "qqs", "vat")
            && containsAny(h, "сумма", "сумм", "summa")) {
            return SKIP;
        }
        if (containsAny(h, "ндс", "ққс", "qqs", "vat") && containsAny(h, "ставк", "rate", "%")) {
            return VAT_RATE;
        }
        if (containsAny(h, "бирлиги", "ўлчов", "olchov", "единица")) {
            return SKIP;
        }
        if (containsAny(h, "колич", "кол-во", "qty", "миқдор", "миқдори", "miqdor", "количество", "сони", "dona")) {
            return QTY;
        }
        if (containsAny(h, "наименован", "маҳсулот", "mahsulot", "номи", "название", "name")) {
            return NAME;
        }
        return SKIP;
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
