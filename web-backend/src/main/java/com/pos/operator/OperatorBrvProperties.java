package com.pos.operator;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

/**
 * БРВ и правило порога наличной оплаты (AUR-13).
 * Порог (сум) = brvAmount × cashLimitBrvUnits.
 * При BRV=340000 и units=74 → ≈25,16 млн сум (целевой ориентир 25 млн).
 */
@ConfigurationProperties(prefix = "app.operator.brv")
public class OperatorBrvProperties {

    /** Актуальная БРВ в сумах (заглушка до внешнего API оператора). */
    private BigDecimal amount = new BigDecimal("340000");

    /**
     * Сколько БРВ составляет лимит наличной оплаты.
     * Установленное правило: лимит ≈ 25 млн сум при текущей БРВ.
     */
    private BigDecimal cashLimitBrvUnits = new BigDecimal("74");

    private String currency = "UZS";

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getCashLimitBrvUnits() {
        return cashLimitBrvUnits;
    }

    public void setCashLimitBrvUnits(BigDecimal cashLimitBrvUnits) {
        this.cashLimitBrvUnits = cashLimitBrvUnits;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
