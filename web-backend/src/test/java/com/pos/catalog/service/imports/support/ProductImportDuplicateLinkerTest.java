package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.dto.product.ProductStorePriceRequest;
import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.support.ProductStorePriceApplier;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImportDuplicateLinkerTest {

    @Mock ProductRepository productRepository;
    @Mock StoreRepository storeRepository;
    @Mock ProductStorePriceApplier storePriceApplier;
    @Mock StoreStockService storeStockService;
    @Mock TenantAccessSupport tenantAccess;

    @InjectMocks ProductImportDuplicateLinker linker;

    @Test
    void linkToAssortment_appliesPriceAndEnsuresStoreStock() {
        UUID productId = UUID.randomUUID();
        Company company = Company.builder().id(7).build();
        Product product = Product.builder()
            .id(productId)
            .sku("SKU-1")
            .name("Test")
            .company(company)
            .sellingPrice(new BigDecimal("1000"))
            .isActive(true)
            .build();
        Store store = Store.builder().id(3).name("Oybek").company(company).active(true).build();

        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(storeRepository.findById(3)).thenReturn(Optional.of(store));

        ProductImportPreviewRow row = new ProductImportPreviewRow(
            1, "SKU-1", "Test", null, null, null, null, "dona", null, "PIECE",
            BigDecimal.TEN, new BigDecimal("2000"), null, new BigDecimal("1000"), null,
            ProductImportPreviewRow.STATUS_DUPLICATE, productId, "SKU-1", "Test",
            "Товар уже есть в базе"
        );

        UUID linked = linker.linkToAssortment(row, null, 3);

        assertEquals(productId, linked);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ProductStorePriceRequest>> prices = ArgumentCaptor.forClass(List.class);
        verify(storePriceApplier).applyStorePrices(eq(product), prices.capture());
        assertEquals(3, prices.getValue().get(0).storeId());
        assertEquals(0, new BigDecimal("2000").compareTo(prices.getValue().get(0).price()));
        verify(storeStockService).ensurePresence(product, store);
        verify(productRepository).save(product);
        verify(tenantAccess).assertCanAccessStore(store);
    }

    @Test
    void linkToAssortment_skipsWhenNoExistingId() {
        ProductImportPreviewRow row = new ProductImportPreviewRow(
            1, "SKU-1", "Test", null, null, null, null, "dona", null, "PIECE",
            BigDecimal.ONE, BigDecimal.ONE, null, null, null,
            ProductImportPreviewRow.STATUS_DUPLICATE, null, "SKU-1", "Test", "dup"
        );
        assertEquals(null, linker.linkToAssortment(row, null, 1));
        verify(productRepository, never()).findById(any());
        verify(storeStockService, never()).ensurePresence(any(), any());
    }
}
