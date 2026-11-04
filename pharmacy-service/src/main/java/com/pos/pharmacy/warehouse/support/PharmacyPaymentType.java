package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyReceiptErrors;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * Способ оплаты шапки прихода и метод строки платежа.
 * DEBT — только целиком в долг (не строка split). PARTIAL/MIXED не храним.
 */
public final class PharmacyPaymentType {

    public static final String CASH = "CASH";
    public static final String CARD = "CARD";
    public static final String TRANSFER = "TRANSFER";
    public static final String DEBT = "DEBT";

    private static final Set<String> HEADER_TYPES = Set.of(CASH, CARD, TRANSFER, DEBT);
    private static final Set<String> PAID_METHODS = Set.of(CASH, CARD, TRANSFER);

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
        if (!HEADER_TYPES.contains(normalized)) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_PAYMENT_TYPE);
        }
        return normalized;
    }

    public static String normalizePaidMethod(String method) {
        if (!StringUtils.hasText(method)) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_PAYMENT_METHOD);
        }
        String normalized = method.trim().toUpperCase();
        if (!PAID_METHODS.contains(normalized)) {
            throw PharmacyErrors.of(PharmacyReceiptErrors.PHARM_RECEIPT_PAYMENT_METHOD);
        }
        return normalized;
    }

    public static boolean isPaidMethod(String method) {
        return method != null && PAID_METHODS.contains(method);
    }
}
