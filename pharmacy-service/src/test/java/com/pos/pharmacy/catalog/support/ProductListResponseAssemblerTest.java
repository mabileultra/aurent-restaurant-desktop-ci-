package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.warehouse.service.StoreStockService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductListResponseAssemblerTest {

    @Mock
    private ProductAttributeService productAttributeService;

    @Mock
    private StoreStockService storeStockService;

    @Test
    void assembleBatchesAttrsAndStock() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
            .id(id)
            .sku("S1")
            .name("Test")
            .lowStockAlert(5)
            .stockQuantity(BigDecimal.ZERO)
            .build();
        when(productAttributeService.getAttributesByProductIds(any()))
            .thenReturn(Map.of(id, Map.of("dosageForm", "tab")));
        when(storeStockService.getQuantities(eq(9), any()))
            .thenReturn(Map.of(id, new BigDecimal("12")));

        Executor sync = Runnable::run;
        ProductListResponseAssembler assembler = new ProductListResponseAssembler(
            productAttributeService,
            storeStockService,
            sync
        );

        var responses = assembler.assemble(List.of(product), 9);

        assertEquals(1, responses.size());
        assertEquals(new BigDecimal("12"), responses.get(0).stockQuantity());
        assertEquals("tab", responses.get(0).attributes().get("dosageForm"));
        verify(productAttributeService).getAttributesByProductIds(any());
        verify(storeStockService).getQuantities(eq(9), any());
    }

    @Test
    void assembleWithoutStoreUsesWarehouseSum() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
            .id(id)
            .sku("S1")
            .name("Test")
            .lowStockAlert(10)
            .stockQuantity(new BigDecimal("80"))
            .build();
        when(productAttributeService.getAttributesByProductIds(any())).thenReturn(Map.of());
        when(storeStockService.sumQuantities(any())).thenReturn(Map.of(id, new BigDecimal("2")));

        ProductListResponseAssembler assembler = new ProductListResponseAssembler(
            productAttributeService,
            storeStockService,
            Runnable::run
        );

        var responses = assembler.assemble(List.of(product), null);

        assertEquals(new BigDecimal("2"), responses.get(0).stockQuantity());
        assertEquals(true, responses.get(0).lowStock());
    }
}
