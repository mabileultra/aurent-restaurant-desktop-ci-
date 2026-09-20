package com.pos.pharmacy.warehouse.support;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyImportRetailResolveTest {

    @Test
    void addsVatToNarxWhenMarkupMissing() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("1741.07"),
            new BigDecimal("12"),
            null,
            new BigDecimal("1910.71"),
            new BigDecimal("100")
        );
        assertEquals(new BigDecimal("2140.00"), retail);
    }

    @Test
    void addsVatWhenNarxMatchesUstamaEvenIfAbovePurchaseWithVat() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("8571.18"),
            new BigDecimal("12"),
            new BigDecimal("13.22"),
            new BigDecimal("9704.29"),
            new BigDecimal("10")
        );
        assertEquals(new BigDecimal("10868.80"), retail);
    }

    @Test
    void prefersNarxOverVatSumWhenMarkupPresent() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("1741.07"),
            new BigDecimal("12"),
            new BigDecimal("9.74"),
            new BigDecimal("1910.71"),
            new BigDecimal("100")
        );
        assertEquals(new BigDecimal("2140.00"), retail);
    }

    @Test
    void markupFallbackWhenRetailIsVatSum() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("1741.07"),
            new BigDecimal("12"),
            new BigDecimal("9.74"),
            new BigDecimal("22928.52"),
            new BigDecimal("100")
        );
        assertEquals(new BigDecimal("2139.93"), retail);
    }

    @Test
    void rejectsVatSumAsRetail() {
        assertTrue(PharmacyImportRetailResolve.looksLikeVatSum(
            new BigDecimal("1741.07"),
            new BigDecimal("12"),
            new BigDecimal("100"),
            new BigDecimal("22928.52")
        ));
        assertTrue(PharmacyImportRetailResolve.looksLikeVatSum(
            new BigDecimal("44111.93"),
            new BigDecimal("12"),
            new BigDecimal("1"),
            new BigDecimal("5582.14")
        ));
        assertFalse(PharmacyImportRetailResolve.looksLikeVatSum(
            new BigDecimal("43750.00"),
            new BigDecimal("12"),
            new BigDecimal("1"),
            new BigDecimal("43750.00")
        ));
    }

    @Test
    void zeroUstamaGivesPurchaseWithVat() {
        BigDecimal retail = PharmacyImportRetailResolve.resolve(
            new BigDecimal("43750.00"),
            new BigDecimal("12"),
            BigDecimal.ZERO,
            new BigDecimal("5250.00"),
            BigDecimal.ONE
        );
        assertEquals(new BigDecimal("49000.00"), retail);
    }
}
