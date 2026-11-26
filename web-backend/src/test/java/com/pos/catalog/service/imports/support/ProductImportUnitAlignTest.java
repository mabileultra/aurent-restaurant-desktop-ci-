package com.pos.catalog.service.imports.support;

import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProductImportUnitAlignTest {

    @Test
    void pieceUom_overridesWeightSaleType() {
        assertEquals(SaleType.PIECE, ProductImportUnitAlign.alignSaleType(SaleType.WEIGHT, "pcs"));
        assertEquals(SaleType.PIECE, ProductImportUnitAlign.alignSaleType(SaleType.WEIGHT, "dona"));
        assertEquals(SaleType.PIECE, ProductImportUnitAlign.alignSaleType(SaleType.WEIGHT, "шт"));
    }

    @Test
    void liter_keepsWeight() {
        assertEquals(SaleType.WEIGHT, ProductImportUnitAlign.alignSaleType(SaleType.WEIGHT, "л"));
        assertNull(ProductImportUnitAlign.alignSaleType(null, "litr"));
    }

    @Test
    void displayUnit_usesCanonicalLabel() {
        assertEquals("шт", ProductImportUnitAlign.displayUnit("pcs", UnitCode.PCS));
        assertEquals("l", ProductImportUnitAlign.displayUnit("litr", UnitCode.L));
    }
}
