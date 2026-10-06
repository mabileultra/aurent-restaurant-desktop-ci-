package com.pos.platform.domain;

/**
 * Состояние оплаты компании для экрана «Платежи и должники». Производное от
 * {@link BillingAccountStatus}, баланса и даты следующего списания — в БД не хранится.
 */
public enum BillingPaymentState {
    ACTIVE,
    DUE_SOON,
    OVERDUE,
    SUSPENDED,
    NOT_BILLED
}
