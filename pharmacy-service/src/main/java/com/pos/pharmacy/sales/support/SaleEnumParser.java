package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacySaleErrors;
import com.pos.pharmacy.sales.domain.SaleEnums;

public final class SaleEnumParser {

    private SaleEnumParser() {}

    public static SaleEnums.PaymentMethod paymentMethod(String raw) {
        if (raw == null || raw.isBlank()) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_PAYMENT_REQUIRED);
        }
        try {
            return SaleEnums.PaymentMethod.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_PAYMENT_UNKNOWN, "Неизвестный способ оплаты: " + raw);
        }
    }

    public static SaleEnums.ReceiptType receiptType(String raw) {
        if (raw == null || raw.isBlank()) {
            return SaleEnums.ReceiptType.SALE;
        }
        try {
            return SaleEnums.ReceiptType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_RECEIPT_TYPE_UNKNOWN, "Неизвестный тип чека: " + raw);
        }
    }

    public static SaleEnums.CardType cardType(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return SaleEnums.CardType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw PharmacyErrors.of(PharmacySaleErrors.PHARM_SALE_CARD_TYPE_UNKNOWN, "Неизвестный тип карты: " + raw);
        }
    }
}
