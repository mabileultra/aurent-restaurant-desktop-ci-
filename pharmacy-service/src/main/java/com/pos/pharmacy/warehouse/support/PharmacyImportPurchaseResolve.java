package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;

/**
 * Цена закупки без НДС для строки фактуры.
 * Явная колонка {@code PURCHASE} (Сотиб олиш / Нарҳ) важнее;
 * иначе SoT — {@code PURCHASE_WITH_VAT} / qty → без НДС.
 */
public final class PharmacyImportPurchaseResolve {

    private PharmacyImportPurchaseResolve() {
    }

    public static BigDecimal unitWithoutVat(
        BigDecimal purchaseRaw,
        BigDecimal purchaseWithVatRaw,
        BigDecimal vatPercent,
        BigDecimal qty
    ) {
        if (purchaseRaw != null && purchaseRaw.compareTo(BigDecimal.ZERO) > 0) {
            return purchaseRaw;
        }
        BigDecimal unitGross = PharmacyImportPurchaseWithVat.unitFromCell(
            purchaseWithVatRaw, null, qty
        );
        if (unitGross != null) {
            return PharmacyReceiptPricing.withoutVat(unitGross, vatPercent);
        }
        return BigDecimal.ZERO;
    }
}
