package com.pos.catalog.service.product;

import com.pos.catalog.entity.Product;
import com.pos.catalog.mapper.ProductMapper;
import com.pos.catalog.mapper.ProductStorePriceMapper;
import com.pos.catalog.repository.ProductStorePriceRepository;
import com.pos.catalog.service.ProductAttributeService;
import com.pos.inventory.repository.projection.ProductDispatchedSum;
import com.pos.inventory.repository.stock.StockMovementQueryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductResponseAssemblerDispatchedScopeTest {

    @Mock ProductMapper productMapper;
    @Mock ProductStorePriceMapper productStorePriceMapper;
    @Mock ProductStorePriceRepository productStorePriceRepository;
    @Mock StockMovementQueryRepository stockMovementQueryRepository;
    @Mock ProductExtensionMapper extensionMapper;
    @Mock ProductAttributeService productAttributeService;

    @InjectMocks ProductResponseAssembler assembler;

    @Test
    void loadDispatchedCounts_passesStoreIdToRepository() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        when(stockMovementQueryRepository.sumDispatchedByProductIds(eq(List.of(id)), eq(30432)))
            .thenReturn(List.of(new ProductDispatchedSum(id, 0L)));

        Map<UUID, Integer> map = assembler.loadDispatchedCounts(List.of(product), 30432);

        assertEquals(0, map.get(id));
        verify(stockMovementQueryRepository).sumDispatchedByProductIds(eq(List.of(id)), eq(30432));
    }

    @Test
    void loadDispatchedCounts_nullStoreMeansCompanyWide() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        when(stockMovementQueryRepository.sumDispatchedByProductIds(eq(List.of(id)), isNull()))
            .thenReturn(List.of(new ProductDispatchedSum(id, 12L)));

        Map<UUID, Integer> map = assembler.loadDispatchedCounts(List.of(product), null);

        assertEquals(12, map.get(id));
        verify(stockMovementQueryRepository).sumDispatchedByProductIds(eq(List.of(id)), isNull());
    }
}
