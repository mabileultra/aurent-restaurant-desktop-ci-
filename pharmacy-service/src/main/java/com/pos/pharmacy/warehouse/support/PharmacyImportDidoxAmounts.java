package com.pos.pharmacy.warehouse.support;

import java.math.BigDecimal;
import java.util.List;

final class PharmacyImportDidoxAmounts {

    private static final BigDecimal HALF_CENT = new BigDecimal("0.005");
    private static final BigDecimal CENT = new BigDecimal("0.01");

    private PharmacyImportDidoxAmounts() {}

    /** Match receives cells without headers. Confirm the Didox price block by its column order and amounts. */
    static BigDecimal lineTotalWithVat(List<String> row, int purchase, int quantity, int retail, int vat) {
        if (purchase < 0 || quantity != purchase + 2 || retail != quantity + 1 || vat != retail + 2) {
            return null;
        }
        BigDecimal units = amount(row, quantity);
        BigDecimal unitPrice = amount(row, retail);
        BigDecimal netTotal = amount(row, retail + 1);
        BigDecimal vatRate = amount(row, vat);
        BigDecimal vatAmount = amount(row, vat + 1);
        BigDecimal grossTotal = amount(row, vat + 2);
        if (units == null || units.signum() <= 0 || unitPrice == null || unitPrice.signum() < 0
            || netTotal == null || vatRate == null || vatRate.signum() < 0 || vatRate.compareTo(BigDecimal.valueOf(100)) > 0
            || vatAmount == null || grossTotal == null || grossTotal.signum() < 0) {
            return null;
        }

        // Didox may round the displayed unit price independently of the line total.
        BigDecimal netTolerance = units.add(BigDecimal.ONE).multiply(HALF_CENT);
        if (differs(netTotal, unitPrice.multiply(units), netTolerance)
            || differs(vatAmount, netTotal.multiply(vatRate.movePointLeft(2)), CENT)
            || differs(grossTotal, netTotal.add(vatAmount), CENT)) {
            return null;
        }
        return grossTotal;
    }

    private static BigDecimal amount(List<String> row, int index) {
        return PharmacyImportValueParser.decimal(PharmacyImportValueParser.cell(row, index));
    }

    private static boolean differs(BigDecimal actual, BigDecimal expected, BigDecimal tolerance) {
        return actual.subtract(expected).abs().compareTo(tolerance) > 0;
    }
}
