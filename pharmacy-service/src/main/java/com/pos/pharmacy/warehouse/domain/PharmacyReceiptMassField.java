package com.pos.pharmacy.warehouse.domain;

public enum PharmacyReceiptMassField {
    QUANTITY,
    UNITS_IN_PACK,
    PURCHASE,
    VAT,
    MARKUP,
    RETAIL,
    BATCH,
    EXPIRY;

    /** Количество, ед. в уп., серия и срок после проведения трогать нельзя. */
    public boolean locksStock() {
        return this == QUANTITY || this == UNITS_IN_PACK || this == BATCH || this == EXPIRY;
    }
}
