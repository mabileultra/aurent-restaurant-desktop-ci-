package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductImportUnitRulesTest {

    @Test
    void fileLiter_becomesWeightLiter() {
        ProductImportPreviewRow row = preview("л", "WEIGHT", "L");
        ProductQuantityRules rules = ProductImportUnitRules.resolve(row, null);
        assertEquals(SaleType.WEIGHT, rules.saleType());
        assertEquals(UnitCode.L, rules.unitCode());
    }

    @Test
    void overrideUnitCodeToPcs_forcesPieceEvenIfFileWasLiter() {
        ProductImportPreviewRow row = preview("л", "WEIGHT", "L");
        var opts = new ProductImportConfirmRequest.ImportRowConfirm(
            1, null, null, null, null, null, null, null, null, null, null,
            "PIECE", "PCS", "pcs"
        );
        ProductQuantityRules rules = ProductImportUnitRules.resolve(row, opts);
        assertEquals(SaleType.PIECE, rules.saleType());
        assertEquals(UnitCode.PCS, rules.unitCode());
        assertEquals("pcs", ProductImportUnitRules.resolveUnitOfMeasureLabel(row, opts, rules));
    }

    @Test
    void overrideUnitCodeOnly_infersPieceAndCanonicalLabel() {
        ProductImportPreviewRow row = preview("litr", "WEIGHT", "L");
        var opts = new ProductImportConfirmRequest.ImportRowConfirm(
            1, null, null, null, null, null, null, null, null, null, null,
            null, "PCS", null
        );
        ProductQuantityRules rules = ProductImportUnitRules.resolve(row, opts);
        assertEquals(SaleType.PIECE, rules.saleType());
        assertEquals(UnitCode.PCS, rules.unitCode());
        assertEquals("шт", ProductImportUnitRules.resolveUnitOfMeasureLabel(row, opts, rules));
    }

    @Test
    void overrideKgToLiter_keepsWeight() {
        ProductImportPreviewRow row = preview("кг", "WEIGHT", "KG");
        var opts = new ProductImportConfirmRequest.ImportRowConfirm(
            1, null, null, null, null, null, null, null, null, null, null,
            null, "L", null
        );
        ProductQuantityRules rules = ProductImportUnitRules.resolve(row, opts);
        assertEquals(SaleType.WEIGHT, rules.saleType());
        assertEquals(UnitCode.L, rules.unitCode());
    }

    @Test
    void emptyOpts_keepsFileDonaAsPiece() {
        ProductImportPreviewRow row = preview("dona", "PIECE", "PCS");
        ProductQuantityRules rules = ProductImportUnitRules.resolve(row, null);
        assertEquals(SaleType.PIECE, rules.saleType());
        assertEquals(UnitCode.PCS, rules.unitCode());
        assertEquals("dona", ProductImportUnitRules.resolveUnitOfMeasureLabel(row, null, rules));
    }

    @Test
    void saleTypeForUnit_pieceFamily() {
        assertEquals(SaleType.PIECE, ProductImportUnitRules.saleTypeForUnit(UnitCode.PCS));
        assertEquals(SaleType.PIECE, ProductImportUnitRules.saleTypeForUnit(UnitCode.PACK));
        assertEquals(SaleType.WEIGHT, ProductImportUnitRules.saleTypeForUnit(UnitCode.L));
        assertEquals(SaleType.WEIGHT, ProductImportUnitRules.saleTypeForUnit(UnitCode.KG));
    }

    private static ProductImportPreviewRow preview(String uom, String saleType, String unitCode) {
        return new ProductImportPreviewRow(
            1, "SKU-1", "Oil", null, null, null, null, uom, null, saleType, unitCode,
            BigDecimal.ONE, BigDecimal.TEN, null, null, null,
            ProductImportPreviewRow.STATUS_NEW, null, null, null, null, null, null
        );
    }
}
