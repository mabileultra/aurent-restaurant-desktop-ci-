package com.pos.restaurant.payment.domain;

public enum PaymentMethod {
    CASH,
    CARD,
    /** Full amount by QR / transfer — no cash, no card brand. */
    CASHLESS,
    MIXED,
    /** Guest pays later — not cash/card till drawn. */
    CREDIT,
    /** Prepaid balance applied to the check. */
    ADVANCE
}
