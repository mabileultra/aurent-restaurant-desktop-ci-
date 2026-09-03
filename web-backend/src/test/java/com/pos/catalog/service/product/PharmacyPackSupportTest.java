package com.pos.catalog.service.product;

import com.pos.catalog.entity.Product;
import com.pos.domain.ProductQuantityRules;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import com.pos.util.QuantityValidator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PharmacyPackSupportTest {

    @Test
    void costEstimate_pieceEncoded_usesShareOfPackCost() {
        Product product = Product.builder()
            .costPrice(new BigDecimal("18000"))
            .sellingPrice(new BigDecimal("22000"))
            .build();
        Map<String, String> attrs = Map.of("units_in_pack", "30");

        BigDecimal cost = PharmacyPackSupport.costEstimate(
            product,
            new BigDecimal("733.33"),
            BigDecimal.ONE,
            attrs
        );

        assertEquals(new BigDecimal("600.00"), cost);
    }

    @Test
    void costEstimate_packFraction_usesCostTimesQty() {
        Product product = Product.builder()
            .costPrice(new BigDecimal("18000"))
            .sellingPrice(new BigDecimal("22000"))
            .build();
        Map<String, String> attrs = Map.of("units_in_pack", "30");

        BigDecimal cost = PharmacyPackSupport.costEstimate(
            product,
            new BigDecimal("22000"),
            new BigDecimal("0.033"),
            attrs
        );

        assertEquals(new BigDecimal("594.00"), cost);
    }

    @Test
    void costEstimate_fullPack_unchanged() {
        Product product = Product.builder()
            .costPrice(new BigDecimal("18000"))
            .sellingPrice(new BigDecimal("22000"))
            .build();
        Map<String, String> attrs = Map.of("units_in_pack", "30");

        BigDecimal cost = PharmacyPackSupport.costEstimate(
            product,
            new BigDecimal("22000"),
            BigDecimal.ONE,
            attrs
        );

        assertEquals(new BigDecimal("18000.00"), cost);
    }

    @Test
    void reportableUnits_packFraction_countsPieces() {
        Product product = Product.builder()
            .sellingPrice(new BigDecimal("22000"))
            .build();
        long units = PharmacyPackSupport.reportableUnits(
            product,
            new BigDecimal("22000"),
            new BigDecimal("0.033"),
            Map.of("units_in_pack", "30")
        );
        assertEquals(1L, units);
    }

    @Test
    void quantityValidator_allowsFractionWhenPackRules() {
        Product product = Product.builder()
            .saleType(SaleType.PIECE)
            .unitCode(UnitCode.PCS)
            .quantityScale(0)
            .allowFraction(false)
            .build();
        ProductQuantityRules rules = PharmacyPackSupport.checkoutQuantityRules(
            product,
            Map.of("units_in_pack", "30")
        );
        assertTrue(rules.allowFraction());
        QuantityValidator.validate(rules, new BigDecimal("0.033"));
    }

    @Test
    void costEstimate_infersUnitsFromPiecePrice_withoutAttribute() {
        Product product = Product.builder()
            .costPrice(new BigDecimal("18000"))
            .sellingPrice(new BigDecimal("22000"))
            .build();

        BigDecimal cost = PharmacyPackSupport.costEstimate(
            product,
            new BigDecimal("733.20"),
            BigDecimal.ONE,
            Map.of()
        );

        assertEquals(new BigDecimal("600.00"), cost);
    }

    @Test
    void quantityValidator_rejectsFractionWithoutPack() {
        ProductQuantityRules rules = new ProductQuantityRules(SaleType.PIECE, UnitCode.PCS, 0, false);
        assertFalse(rules.allowFraction());
        org.junit.jupiter.api.Assertions.assertThrows(
            com.pos.exception.BadRequestException.class,
            () -> QuantityValidator.validate(rules, new BigDecimal("0.033"))
        );
    }
}
