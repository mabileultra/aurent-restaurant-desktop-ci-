package com.pos.spreadsheet.parser;

import com.pos.util.ProductImportParseUtil;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Когда colspan сдвинул колонки, в «Миқдор» оказывается сумма (миллионы),
 * а unit price = сумма_с_НДС / qty ≈ 0.01. Восстанавливаем qty и цену
 * из «Нарҳ» / суммы с НДС.
 */
public final class UzInvoiceQtyPriceSanitizer {

    private static final BigDecimal TINY_UNIT = new BigDecimal("1.00");
    private static final BigDecimal MIN_SANE_NET = new BigDecimal("10");

    private UzInvoiceQtyPriceSanitizer() {
    }

    public record QtyPrice(BigDecimal qty, BigDecimal unitPriceWithVat) {
    }

    public static QtyPrice sanitize(
        BigDecimal qty,
        BigDecimal unitPriceWithVat,
        String netUnitPriceRaw,
        String lineTotalWithVatRaw,
        String vatRateRaw
    ) {
        if (qty == null || qty.signum() <= 0 || unitPriceWithVat == null) {
            return new QtyPrice(qty, unitPriceWithVat);
        }
        if (unitPriceWithVat.compareTo(TINY_UNIT) >= 0) {
            return new QtyPrice(qty, unitPriceWithVat);
        }

        Optional<BigDecimal> fromNet = UzInvoicePriceWithVatResolver.resolveUnitPriceWithVat(
            "1", netUnitPriceRaw, "", vatRateRaw
        );
        BigDecimal lineTotal = ProductImportParseUtil.parseDecimalOpt(lineTotalWithVatRaw).orElse(null);
        BigDecimal net = ProductImportParseUtil.parseDecimalOpt(netUnitPriceRaw).orElse(null);

        if (fromNet.isEmpty() || fromNet.get().compareTo(MIN_SANE_NET) < 0) {
            return new QtyPrice(qty, unitPriceWithVat);
        }
        BigDecimal saneUnit = fromNet.get();

        if (lineTotal != null && lineTotal.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal recoveredQty = lineTotal.divide(saneUnit, 3, RoundingMode.HALF_UP);
            if (recoveredQty.compareTo(BigDecimal.ZERO) > 0 && recoveredQty.compareTo(qty) < 0) {
                return new QtyPrice(recoveredQty, saneUnit);
            }
        }

        if (net != null && net.compareTo(MIN_SANE_NET) >= 0) {
            return new QtyPrice(qty, saneUnit);
        }
        return new QtyPrice(qty, unitPriceWithVat);
    }
}
