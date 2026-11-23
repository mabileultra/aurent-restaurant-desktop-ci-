package com.pos.spreadsheet.parser;

import com.pos.util.ProductImportParseUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Цена позиции счёт-фактуры для POS: всегда с НДС.
 * Приоритет — сумма поставки с ҚҚС / кол-во; иначе «Нарх» × (1 + ставка).
 * Пустая/отсутствующая ставка → net без накрутки (не дефолт 12%).
 * Если «сумма строки» ≈ «Нарх» при qty&gt;1 — это чужая колонка, не делим (8000/10≠800).
 */
public final class UzInvoicePriceWithVatResolver {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal NEAR_RATIO = new BigDecimal("0.02");

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
        BigDecimal net = ProductImportParseUtil.parseDecimalOpt(netUnitPriceRaw).orElse(null);

        if (lineTotal != null && lineTotal.compareTo(BigDecimal.ZERO) > 0
            && qty != null && qty.compareTo(BigDecimal.ZERO) > 0
            && !lineTotalLooksLikeUnitPrice(lineTotal, net, qty)) {
            return Optional.of(lineTotal.divide(qty, MONEY_SCALE, RoundingMode.HALF_UP));
        }

        return fromNetUnitPrice(net, vatRateRaw);
    }

    /**
     * Сумма строки ошибочно = цена за единицу (или того же порядка), деление на qty портит цену.
     */
    static boolean lineTotalLooksLikeUnitPrice(BigDecimal lineTotal, BigDecimal net, BigDecimal qty) {
        if (net == null || net.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }
        if (qty.compareTo(BigDecimal.ONE) <= 0) {
            return false;
        }
        BigDecimal base = net.abs().max(BigDecimal.ONE);
        BigDecimal delta = lineTotal.subtract(net).abs();
        return delta.compareTo(base.multiply(NEAR_RATIO)) <= 0;
    }

    private static Optional<BigDecimal> fromNetUnitPrice(BigDecimal net, String vatRateRaw) {
        if (net == null || net.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.empty();
        }

        Optional<BigDecimal> parsedVat = ProductImportParseUtil.parseDecimalOpt(
            vatRateRaw != null ? vatRateRaw.replace("%", "").trim() : ""
        );
        if (parsedVat.isEmpty()) {
            return Optional.of(net.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal vatPercent = ProductImportParseUtil.normalizeTaxRatePercent(parsedVat.get());
        if (vatPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return Optional.of(net.setScale(MONEY_SCALE, RoundingMode.HALF_UP));
        }

        BigDecimal factor = BigDecimal.ONE.add(
            vatPercent.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP)
        );
        return Optional.of(net.multiply(factor).setScale(MONEY_SCALE, RoundingMode.HALF_UP));
    }
}
