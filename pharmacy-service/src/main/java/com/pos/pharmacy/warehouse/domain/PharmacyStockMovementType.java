package com.pos.pharmacy.warehouse.domain;

/** Складские операции — единственный способ менять остаток. */
public final class PharmacyStockMovementType {

    public static final String RECEIPT = "RECEIPT";
    public static final String OPENING = "OPENING";
    public static final String SALE = "SALE";
    public static final String RETURN = "RETURN";
    public static final String ADJUSTMENT = "ADJUSTMENT";
    public static final String TRANSFER = "TRANSFER";

    public static final String REF_INVENTORY = "INVENTORY";
    public static final String REF_RECEIPT = "RECEIPT";
    public static final String REF_TRANSFER = "TRANSFER";

    private PharmacyStockMovementType() {}
}
