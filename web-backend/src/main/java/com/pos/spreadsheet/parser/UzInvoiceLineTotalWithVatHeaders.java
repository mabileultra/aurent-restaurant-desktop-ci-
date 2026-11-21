package com.pos.spreadsheet.parser;

import org.springframework.util.StringUtils;

/**
 * Эвристика колонки «сумма строки с НДС», не путать с unit price with VAT.
 */
public final class UzInvoiceLineTotalWithVatHeaders {

    private UzInvoiceLineTotalWithVatHeaders() {
    }

    public static boolean matches(String header) {
        if (!StringUtils.hasText(header)) {
            return false;
        }
        String h = header.trim().toLowerCase();
        if (looksLikeUnitPrice(h)) {
            return false;
        }
        if (containsAny(h,
            "ҳисобга олган", "хисобга олган", "hisobga olgan",
            "включая ндс", "с учётом ндс", "с учетом ндс",
            "with vat", "including vat", "incl. vat", "incl vat")) {
            return hasValueMarker(h) || containsAny(h, "ҳисобга", "хисобга", "hisobga");
        }
        boolean valueCol = hasValueMarker(h);
        boolean withVat = (h.contains("ққс") || h.contains("qqs") || h.contains("ндс"))
            && (h.contains("олган") || h.contains("учёт") || h.contains("учет"));
        return valueCol && withVat;
    }

    private static boolean hasValueMarker(String h) {
        return containsAny(h,
            "қиймат", "qiymat", "сумма постав", "стоимость",
            "delivery", "сумма", "итого", "total", "amount"
        );
    }

    private static boolean looksLikeUnitPrice(String h) {
        boolean unitLike = containsAny(h, "нарх", "цена", "price", "unit price", "unit_price", "unitprice");
        if (!unitLike) {
            return false;
        }
        return !hasValueMarker(h);
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
