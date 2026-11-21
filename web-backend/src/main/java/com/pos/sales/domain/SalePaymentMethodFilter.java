package com.pos.sales.domain;

/**
 * Специальные значения query {@code paymentMethod} (не enum {@code Sale.PaymentMethod}).
 */
public final class SalePaymentMethodFilter {

    /** Чеки с card_amount &gt; 0 — тот же смысл, что KPI «Безнал» (SUM card_amount). */
    public static final String NON_CASH = "NON_CASH";

    private SalePaymentMethodFilter() {}

    public static boolean isNonCash(String raw) {
        return raw != null && NON_CASH.equalsIgnoreCase(raw.trim());
    }
}
