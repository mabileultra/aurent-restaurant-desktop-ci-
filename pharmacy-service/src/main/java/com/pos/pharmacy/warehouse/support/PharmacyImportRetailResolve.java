package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Didox: «Нарҳ» без НДС. Если пользователь вручную выбрал колонку RETAIL —
 * берём её (не подменяем устамой), кроме явной суммы НДС / ставки %.
 */
public final class PharmacyImportRetailResolve {

    private static final BigDecimal HALF = new BigDecimal("0.5");
    private static final BigDecimal THREE = new BigDecimal("3");
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal REL = new BigDecimal("0.08");

    private PharmacyImportRetailResolve() {}

    public static BigDecimal resolve(
        BigDecimal purchase,
        BigDecimal vatPercent,
        BigDecimal markupPercent,
        BigDecimal retailRaw,
        BigDecimal qty
    ) {
        BigDecimal purchaseWithVat = PharmacyReceiptPricing.withVat(purchase, vatPercent);
        if (retailRaw != null
            && !looksLikeVatSum(purchase, vatPercent, qty, retailRaw)
            && !looksLikePercentRate(retailRaw, purchase)) {
            if (looksLikeExVatUnit(purchase, purchaseWithVat, markupPercent, retailRaw)) {
                return PharmacyReceiptPricing.withVat(retailRaw, vatPercent);
            }
            // Ручной маппинг «Розничная цена» — значение колонки как есть
            return retailRaw.setScale(2, RoundingMode.HALF_UP);
        }
        if (markupPercent != null) {
            return PharmacyReceiptPricing.retailFromMarkup(purchaseWithVat, markupPercent);
        }
        return null;
    }

    /** 12 / 12% ошибочно выбраны как розница. */
    static boolean looksLikePercentRate(BigDecimal value, BigDecimal purchase) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (value.compareTo(HUNDRED) > 0) {
            return false;
        }
        if (purchase != null
            && purchase.compareTo(BigDecimal.ZERO) > 0
            && value.compareTo(purchase.multiply(HALF)) >= 0) {
            return false;
        }
        return true;
    }

    static boolean looksLikeVatSum(
        BigDecimal purchase,
        BigDecimal vatPercent,
        BigDecimal qty,
        BigDecimal value
    ) {
        if (purchase == null || value == null) {
            return false;
        }
        if (purchase.compareTo(BigDecimal.ZERO) <= 0 || value.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (value.compareTo(purchase.multiply(HALF)) >= 0
            && value.compareTo(purchase.multiply(THREE)) <= 0) {
            return false;
        }
        if (qty != null && qty.compareTo(BigDecimal.ONE) > 0) {
            BigDecimal perUnit = value.divide(qty, 4, RoundingMode.HALF_UP);
            if (perUnit.compareTo(purchase.multiply(HALF)) < 0) {
                return true;
            }
        }
        if (vatPercent != null
            && (qty == null || qty.compareTo(BigDecimal.ONE) == 0)
            && value.compareTo(purchase.multiply(HALF)) < 0) {
            BigDecimal rate = vatPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
            BigDecimal fromPurchase = purchase.multiply(rate);
            BigDecimal fromMarked = purchase.multiply(new BigDecimal("1.20")).multiply(rate);
            return near(fromPurchase, value) || near(fromMarked, value)
                || (value.compareTo(fromPurchase.multiply(HALF)) >= 0
                && value.compareTo(fromMarked.multiply(new BigDecimal("1.5"))) <= 0);
        }
        if (vatPercent != null && qty != null && qty.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rate = vatPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
            return near(purchase.multiply(rate).multiply(qty), value)
                || near(purchase.multiply(new BigDecimal("1.20")).multiply(rate).multiply(qty), value);
        }
        return false;
    }

    static boolean looksLikeExVatUnit(
        BigDecimal purchase,
        BigDecimal purchaseWithVat,
        BigDecimal markupPercent,
        BigDecimal retailRaw
    ) {
        if (retailRaw == null || retailRaw.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (purchaseWithVat != null
            && purchaseWithVat.compareTo(BigDecimal.ZERO) > 0
            && retailRaw.compareTo(purchaseWithVat) < 0) {
            return true;
        }
        if (purchase != null && markupPercent != null && purchase.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal expected = purchase.multiply(
                BigDecimal.ONE.add(markupPercent.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
            );
            return near(expected, retailRaw);
        }
        return false;
    }

    private static boolean near(BigDecimal expected, BigDecimal actual) {
        if (expected == null || actual == null || expected.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        BigDecimal diff = expected.subtract(actual).abs();
        return diff.divide(expected, 6, RoundingMode.HALF_UP).compareTo(REL) <= 0;
    }
}
