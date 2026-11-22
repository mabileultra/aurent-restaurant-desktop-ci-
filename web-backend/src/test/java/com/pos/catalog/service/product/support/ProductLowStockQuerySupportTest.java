package com.pos.catalog.service.product.support;

import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.service.support.CatalogIsolationSupport;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductLowStockQuerySupportTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductResponseAssembler assembler;
    @Mock private CatalogIsolationSupport catalogIsolation;
    @Mock private TenantAccessSupport tenantAccess;
    @Mock private StoreStockService storeStockService;

    @InjectMocks
    private ProductLowStockQuerySupport support;

    @Test
    void listWithStoreUsesStoreScopedQuery() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findGroceryLowStockIdsForStore(eq(7), eq(48), any(Pageable.class)))
            .thenReturn(List.of());

        support.list(100, 48);

        verify(storeStockService).requireStoreForCompany(7, 48);
        verify(productRepository).findGroceryLowStockIdsForStore(eq(7), eq(48), any(Pageable.class));
    }

    @Test
    void listWithoutStoreUsesCompanyQuery() {
        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findGroceryLowStockIds(eq(7), any(Pageable.class)))
            .thenReturn(List.of());

        support.list(100, null);

        verify(productRepository).findGroceryLowStockIds(eq(7), any(Pageable.class));
    }
}
