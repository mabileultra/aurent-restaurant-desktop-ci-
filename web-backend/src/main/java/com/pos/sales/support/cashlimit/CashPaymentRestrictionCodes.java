package com.pos.sales.support.cashlimit;

/** Стабильные reasonCode для фронта (AUR-13). */
public final class CashPaymentRestrictionCodes {

    public static final String CATEGORY_FORBIDDEN = "CASH_PAYMENT_CATEGORY_FORBIDDEN";
    public static final String VEHICLE_AGE_FORBIDDEN = "CASH_PAYMENT_VEHICLE_AGE_FORBIDDEN";
    public static final String AMOUNT_LIMIT = "CASH_PAYMENT_AMOUNT_LIMIT";

    private CashPaymentRestrictionCodes() {
    }
}
