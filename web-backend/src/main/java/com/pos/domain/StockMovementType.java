package com.pos.domain;

public final class StockMovementType {

    public static final String SALE = "SALE";
    public static final String RESTOCK = "RESTOCK";
    public static final String ADJUSTMENT = "ADJUSTMENT";
    public static final String RETURN = "RETURN";
    public static final String WRITE_OFF = "WRITE_OFF";
    /** Внутренний расход (не брак). */
    public static final String EXPENSE = "EXPENSE";
    /** Списание ингредиентов на производство. */
    public static final String PRODUCTION_CONSUMPTION = "PRODUCTION_CONSUMPTION";
    /** Приход выхода производства. */
    public static final String PRODUCTION_OUTPUT = "PRODUCTION_OUTPUT";

    private StockMovementType() {
    }
}
