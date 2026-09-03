package com.pos.integrations.multikassa.domain;

/**
 * Типы операций Multikassa (module_operation_type).
 */
public final class MultikassaOperationType {

    public static final String OPEN_SHIFT = "1";
    public static final String CLOSE_SHIFT = "2";
    public static final String SALE = "3";
    public static final String REFUND = "4";
    public static final String X_REPORT = "7";
    public static final String ADVANCE = "8";
    public static final String CREDIT = "10";

    private MultikassaOperationType() {
    }
}
