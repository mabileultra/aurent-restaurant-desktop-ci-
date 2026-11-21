package com.pos.pharmacy.importing.spreadsheet.parser;

import com.pos.pharmacy.util.ProductImportParseUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Цена позиции счёт-фактуры для POS: всегда с НДС.
 * Приоритет — сумма поставки с ҚҚС / кол-во; иначе «Нарх» × (1 + ставка).
 */
public final class UzInvoicePriceWithVatResolver {

    private static final int MONEY_SCALE = 2;

    private UzInvoicePriceWithVatResolver() {
    }

    public static Optional<BigDecimal> resolveUnitPriceWithVat(
        String qtyRaw,
        String netUnitPriceRaw,
        String lineTotalWithVatRaw,
        String vatRateRaw
    ) {
        BigDecimal qty = ProductImportParseUtil.parseDecimalOpt(qtyRaw).orElse(null);
        BigDecimal lineTotal = ProductImportParseUtil.parseDecimalOpt(lineTotalWithVatRaw).orElse(null);
        if (lineTotal != null && lineTotal.compareTo(BigDecimal.ZERO) > 0
            && qty != null && qty.compareTo(BigDecimal.ZERO) > 0) {
            return Optional.of(lineTotal.divide(qty, MONEY_SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal net = ProductImportParseUtil.parseDecimalOpt(netUnitPriceRaw).orElse(null);
        if (net == null || net.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.empty();
        }

        BigDecimal vatPercent = ProductImportParseUtil.normalizeTaxRatePercent(
            ProductImportParseUtil.parseDecimalOpt(
                vatRateRaw != null ? vatRateRaw.replace("%", "").trim() : ""
            ).orElse(null)
        );
        if (vatPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.of(net.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal factor = BigDecimal.ONE.add(
            vatPercent.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP)
        );
        return Optional.of(net.multiply(factor).setScale(MONEY_SCALE, RoundingMode.HALF_UP));
    }
}
