package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Didox «Етказиб … ҚҚСни ҳисобга олган» — сумма строки с НДС.
 * В приёмке храним цену за 1 шт с НДС; при сумме строки делим на qty.
 */
public final class PharmacyImportPurchaseWithVat {

    private static final BigDecimal HALF = new BigDecimal("0.5");

    private PharmacyImportPurchaseWithVat() {}

    /**
     * @param raw cell PURCHASE_WITH_VAT (unit or line total)
     * @param purchaseExVat unit purchase without VAT (Сотиб олиш), may be null
     * @param qty quantity, may be null
     * @return unit price with VAT, or null
     */
    public static BigDecimal unitFromCell(BigDecimal raw, BigDecimal purchaseExVat, BigDecimal qty) {
        if (raw == null || raw.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        if (qty != null
            && qty.compareTo(BigDecimal.ONE) > 0
            && looksLikeLineTotal(raw, purchaseExVat, qty)) {
            return raw.divide(qty, 2, RoundingMode.HALF_UP);
        }
        return raw.setScale(2, RoundingMode.HALF_UP);
    }

    static boolean looksLikeLineTotal(BigDecimal raw, BigDecimal purchaseExVat, BigDecimal qty) {
        if (raw == null || qty == null || qty.compareTo(BigDecimal.ONE) <= 0) {
            return false;
        }
        if (purchaseExVat != null && purchaseExVat.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal approxLine = purchaseExVat.multiply(qty);
            // Line total ≫ unit and in the ballpark of unit×qty (with or without VAT).
            return raw.compareTo(purchaseExVat.multiply(new BigDecimal("2"))) > 0
                && raw.compareTo(approxLine.multiply(HALF)) >= 0;
        }
        // No unit hint: Didox with-VAT column is always a line sum when qty > 1.
        return true;
    }
}
