package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import org.springframework.util.StringUtils;

/** Оплата поступления: наличные, долг поставщику, перечисление. Старый CREDIT читается как долг. */
public final class PharmacyPaymentType {

    public static final String CASH = "CASH";
    public static final String DEBT = "DEBT";
    public static final String TRANSFER = "TRANSFER";

    private PharmacyPaymentType() {
    }

    public static String normalize(String paymentType) {
        if (!StringUtils.hasText(paymentType)) {
            return CASH;
        }
        String normalized = paymentType.trim().toUpperCase();
        if ("CREDIT".equals(normalized)) {
            return DEBT;
        }
        if (!CASH.equals(normalized) && !DEBT.equals(normalized) && !TRANSFER.equals(normalized)) {
            throw PharmacyErrors.badRequest("paymentType must be CASH, DEBT or TRANSFER");
        }
        return normalized;
    }
}
