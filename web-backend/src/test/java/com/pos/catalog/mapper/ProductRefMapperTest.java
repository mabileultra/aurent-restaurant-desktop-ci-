package com.pos.catalog.mapper;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.entity.Product;
import com.pos.domain.SaleType;
import com.pos.domain.UnitCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductRefMapperTest {

    private final ProductRefMapper mapper = new ProductRefMapper();

    @Test
    void mapsCoreFieldsAndWeightedFlag() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
            .id(id)
            .sku("SKU-1")
            .name("Milk")
            .barcode("460123")
            .sellingPrice(new BigDecimal("12.50"))
            .costPrice(new BigDecimal("8.00"))
            .unitCode(UnitCode.KG)
            .isActive(true)
            .saleType(SaleType.WEIGHT)
            .build();

        ProductRef ref = mapper.toRef(product);

        assertEquals(id, ref.id());
        assertNull(ref.companyId());
        assertEquals("SKU-1", ref.sku());
        assertEquals("Milk", ref.name());
        assertEquals("460123", ref.barcode());
        assertNull(ref.ikpu());
        assertEquals(new BigDecimal("12.50"), ref.sellingPrice());
        assertEquals(new BigDecimal("8.00"), ref.costPrice());
        assertEquals("KG", ref.unitCode());
        assertTrue(ref.active());
        assertTrue(ref.weighted());
    }

    @Test
    void pieceIsNotWeighted() {
        Product product = Product.builder()
            .id(UUID.randomUUID())
            .sku("A")
            .name("Bread")
            .sellingPrice(BigDecimal.ONE)
            .costPrice(BigDecimal.ZERO)
            .unitCode(UnitCode.PCS)
            .isActive(false)
            .saleType(SaleType.PIECE)
            .build();

        ProductRef ref = mapper.toRef(product);

        assertFalse(ref.weighted());
        assertFalse(ref.active());
    }

    @Test
    void nullProductReturnsNull() {
        assertNull(mapper.toRef(null));
    }
}
