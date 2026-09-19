package com.pos.pharmacy.warehouse.domain;

public enum PharmacyReceiptMassField {
    QUANTITY,
    PURCHASE,
    VAT,
    MARKUP,
    RETAIL,
    BATCH,
    EXPIRY;

    /** Количество, серия и срок после проведения трогать нельзя. */
    public boolean locksStock() {
        return this == QUANTITY || this == BATCH || this == EXPIRY;
    }
}
