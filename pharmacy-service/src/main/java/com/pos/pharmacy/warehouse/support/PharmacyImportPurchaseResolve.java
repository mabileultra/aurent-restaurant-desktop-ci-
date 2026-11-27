package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;

/**
 * Цена закупки без НДС для строки фактуры.
 * SoT при наличии колонки — {@code PURCHASE_WITH_VAT} / qty → без НДС (цифры фактуры);
 * иначе unit из {@code PURCHASE} (Сотиб олиш / Нарҳ).
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
        // hint=null: колонка Didox — сумма строки; базавий не должен мешать делению на qty
        BigDecimal unitGross = PharmacyImportPurchaseWithVat.unitFromCell(
            purchaseWithVatRaw, null, qty
        );
        if (unitGross != null) {
            return PharmacyReceiptPricing.withoutVat(unitGross, vatPercent);
        }
        if (purchaseRaw != null && purchaseRaw.compareTo(BigDecimal.ZERO) > 0) {
            return purchaseRaw;
        }
        return BigDecimal.ZERO;
    }

    /** Цена за 1 шт с НДС из колонки фактуры (без unit×ҚҚС%). */
    public static BigDecimal unitWithVat(BigDecimal purchaseWithVatRaw, BigDecimal qty) {
        return PharmacyImportPurchaseWithVat.unitFromCell(purchaseWithVatRaw, null, qty);
    }
}
