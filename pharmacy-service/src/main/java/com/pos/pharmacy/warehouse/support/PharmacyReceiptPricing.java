package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Чистая VAT/наценка математика приёмки (без БД).
 */
public final class PharmacyReceiptPricing {

    private PharmacyReceiptPricing() {}

    public static BigDecimal withVat(BigDecimal purchase, BigDecimal vatPercent) {
        BigDecimal base = scaleMoney(purchase);
        if (vatPercent == null || vatPercent.compareTo(BigDecimal.ZERO) == 0) {
            return base;
        }
        BigDecimal factor = BigDecimal.ONE.add(vatPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        return base.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal withoutVat(BigDecimal withVat, BigDecimal vatPercent) {
        if (withVat == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (vatPercent == null || vatPercent.compareTo(BigDecimal.ZERO) == 0) {
            return withVat.setScale(2, RoundingMode.HALF_UP);
        }
        return withVat.divide(
            BigDecimal.ONE.add(vatPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)),
            2,
            RoundingMode.HALF_UP
        );
    }

    public static BigDecimal retailFromMarkup(BigDecimal purchaseWithVat, BigDecimal markupPercent) {
        if (purchaseWithVat == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (markupPercent == null || markupPercent.compareTo(BigDecimal.ZERO) == 0) {
            return purchaseWithVat.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal factor = BigDecimal.ONE.add(markupPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
        return purchaseWithVat.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal markupFrom(BigDecimal purchaseWithVat, BigDecimal retail) {
        if (purchaseWithVat == null || purchaseWithVat.compareTo(BigDecimal.ZERO) <= 0 || retail == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return retail.subtract(purchaseWithVat)
            .multiply(BigDecimal.valueOf(100))
            .divide(purchaseWithVat, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal unitPrice(BigDecimal retail, BigDecimal unitsInPack) {
        if (retail == null || unitsInPack == null || unitsInPack.compareTo(BigDecimal.ZERO) <= 0) {
            return retail;
        }
        return retail.divide(unitsInPack, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal scaleMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /** Сумма закупки строки: приоритет цена с НДС × кол-во. */
    public static BigDecimal linePurchaseSum(BigDecimal purchaseWithVat, BigDecimal purchaseExVat, BigDecimal quantity) {
        BigDecimal unit = purchaseWithVat != null ? purchaseWithVat : purchaseExVat;
        return scaleMoney(nullToZero(unit).multiply(nullToZero(quantity)));
    }

    public static BigDecimal lineRetailSum(BigDecimal retail, BigDecimal quantity) {
        return scaleMoney(nullToZero(retail).multiply(nullToZero(quantity)));
    }
}
