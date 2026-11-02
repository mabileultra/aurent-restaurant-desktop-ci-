package com.pos.domain;

/**
 * Правила количества для товара: тип продажи, единица, точность, дробность.
 * Не зависит от JPA Product — собирается в catalog ({@code ProductQuantityRulesResolver}).
 */
public record ProductQuantityRules(
    SaleType saleType,
    UnitCode unitCode,
    int quantityScale,
    boolean allowFraction
) {

    public static ProductQuantityRules pieceDefault() {
        return new ProductQuantityRules(SaleType.PIECE, UnitCode.PCS, 0, false);
    }

    public String displayUnitLabel() {
        return unitCode != null ? unitCode.displayLabel() : UnitCode.PCS.displayLabel();
    }
}
