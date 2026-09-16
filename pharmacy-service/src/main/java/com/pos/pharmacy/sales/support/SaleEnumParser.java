package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;

public final class SaleEnumParser {

    private SaleEnumParser() {}

    public static SaleEnums.PaymentMethod paymentMethod(String raw) {
        if (raw == null || raw.isBlank()) {
            throw PharmacyErrors.badRequest("Укажите способ оплаты");
        }
        try {
            return SaleEnums.PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.badRequest("Неизвестный способ оплаты: " + raw);
        }
    }

    public static SaleEnums.ReceiptType receiptType(String raw) {
        if (raw == null || raw.isBlank()) {
            return SaleEnums.ReceiptType.SALE;
        }
        try {
            return SaleEnums.ReceiptType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.badRequest("Неизвестный тип чека: " + raw);
        }
    }

    public static SaleEnums.CardType cardType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return SaleEnums.CardType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.badRequest("Неизвестный тип карты: " + raw);
        }
    }
}
