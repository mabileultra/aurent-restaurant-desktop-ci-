package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.sales.dto.SaleItemRequest;
import com.pos.pharmacy.sales.entity.SaleItem;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutLineAssemblerVatTest {

    @Mock
    private ProductAttributeService productAttributeService;

    @InjectMocks
    private CheckoutQuantityResolver checkoutQuantityResolver;

    @Test
    void assemblesInclusiveVatPerLineWithDefault12Percent() {
        CheckoutLineAssembler assembler = new CheckoutLineAssembler(checkoutQuantityResolver);
        when(productAttributeService.getAttributesByProductIds(any())).thenReturn(Map.of());

        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .name("Аспирин")
            .sellingPrice(new BigDecimal("11200.00"))
            .taxRate(new BigDecimal("12"))
            .build();

        Map<UUID, Map<String, String>> attrs = checkoutQuantityResolver.loadAttributes(List.of(
            new SaleItemRequest(productId, BigDecimal.ONE, null, null, List.of())
        ));
        CheckoutLineAssembler.AssembledLines assembled = assembler.assemble(
            List.of(new SaleItemRequest(productId, BigDecimal.ONE, null, null, List.of())),
            Map.of(productId, product),
            attrs
        );

        assertEquals(1, assembled.items().size());
        SaleItem item = assembled.items().get(0);
        assertEquals(new BigDecimal("1200.00"), item.getTaxAmount());
        assertEquals(new BigDecimal("11200.00"), item.getLineTotal());
        assertEquals(new BigDecimal("10000.00"), assembled.subtotalNet());
        assertEquals(new BigDecimal("1200.00"), assembled.taxTotal());
    }

    @Test
    void zeroTaxRateProducesZeroVat() {
        CheckoutLineAssembler assembler = new CheckoutLineAssembler(checkoutQuantityResolver);
        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .name("Без НДС")
            .sellingPrice(new BigDecimal("5000.00"))
            .taxRate(BigDecimal.ZERO)
            .build();

        CheckoutLineAssembler.AssembledLines assembled = assembler.assemble(
            List.of(new SaleItemRequest(productId, BigDecimal.ONE, null, null, List.of())),
            Map.of(productId, product),
            Map.of(productId, Map.of())
        );

        assertEquals(0, assembled.taxTotal().compareTo(BigDecimal.ZERO));
        assertEquals(0, assembled.subtotalNet().compareTo(new BigDecimal("5000.00")));
    }
}
