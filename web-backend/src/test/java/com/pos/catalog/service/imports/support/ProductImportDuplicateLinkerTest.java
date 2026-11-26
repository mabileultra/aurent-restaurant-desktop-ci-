package com.pos.catalog.service.imports.support;

import com.pos.catalog.dto.product.ProductImportConfirmRequest;
import com.pos.catalog.dto.product.ProductImportPreviewRow;
import com.pos.catalog.entity.Product;
import com.pos.catalog.entity.ProductStorePrice;
import com.pos.catalog.repository.ProductRepository;
import com.pos.catalog.service.product.support.ProductStorePriceApplier;
import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
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
    void linkToAssortment_upsertsPriceWhenStoreHasNone() {
        UUID productId = UUID.randomUUID();
        Company company = Company.builder().id(7).build();
        Product product = Product.builder()
            .id(productId)
            .sku("SKU-1")
            .name("Test")
            .company(company)
            .sellingPrice(new BigDecimal("1000"))
            .isActive(true)
            .storePrices(new ArrayList<>())
            .build();
        Store store = Store.builder().id(3).name("Oybek").company(company).active(true).build();

        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(storeRepository.findById(3)).thenReturn(Optional.of(store));

        ProductImportPreviewRow row = dupRow(productId, new BigDecimal("2000"));

        UUID linked = linker.linkToAssortment(row, null, 3);

        assertEquals(productId, linked);
        verify(storePriceApplier).upsertStorePrice(eq(product), eq(3), eq(new BigDecimal("2000")));
        verify(storeStockService).ensurePresence(product, store);
        verify(productRepository).save(product);
        verify(tenantAccess).assertCanAccessStore(store);
    }

    @Test
    void linkToAssortment_keepsExistingStorePriceUnlessForced() {
        UUID productId = UUID.randomUUID();
        Company company = Company.builder().id(7).build();
        Store store = Store.builder().id(3).name("Oybek").company(company).active(true).build();
        Product product = Product.builder()
            .id(productId)
            .sku("SKU-1")
            .name("Test")
            .company(company)
            .sellingPrice(new BigDecimal("1000"))
            .isActive(true)
            .storePrices(new ArrayList<>(List.of(
                ProductStorePrice.builder()
                    .store(store)
                    .price(new BigDecimal("1500"))
                    .build()
            )))
            .build();

        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(storeRepository.findById(3)).thenReturn(Optional.of(store));

        ProductImportPreviewRow row = dupRow(productId, new BigDecimal("2000"));
        linker.linkToAssortment(row, null, 3);

        verify(storePriceApplier, never()).upsertStorePrice(any(), any(), any());
        verify(storeStockService).ensurePresence(product, store);
    }

    @Test
    void linkToAssortment_forcesPriceWhenRowOptsSet() {
        UUID productId = UUID.randomUUID();
        Company company = Company.builder().id(7).build();
        Store store = Store.builder().id(3).name("Oybek").company(company).active(true).build();
        Product product = Product.builder()
            .id(productId)
            .sku("SKU-1")
            .name("Test")
            .company(company)
            .sellingPrice(new BigDecimal("1000"))
            .isActive(true)
            .storePrices(new ArrayList<>(List.of(
                ProductStorePrice.builder()
                    .store(store)
                    .price(new BigDecimal("1500"))
                    .build()
            )))
            .build();

        when(tenantAccess.requireEffectiveCompanyId()).thenReturn(7);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(storeRepository.findById(3)).thenReturn(Optional.of(store));

        ProductImportPreviewRow row = dupRow(productId, new BigDecimal("2000"));
        var opts = new ProductImportConfirmRequest.ImportRowConfirm(
            1, new BigDecimal("2500"), null, 3, null, null, null, null, null, null, null,
            null, null, null
        );
        linker.linkToAssortment(row, opts, 3);

        verify(storePriceApplier).upsertStorePrice(eq(product), eq(3), eq(new BigDecimal("2500")));
    }

    @Test
    void linkToAssortment_skipsWhenNoExistingId() {
        ProductImportPreviewRow row = new ProductImportPreviewRow(
            1, "SKU-1", "Test", null, null, null, null, "dona", null, "PIECE", "PCS",
            BigDecimal.ONE, BigDecimal.ONE, null, null, null,
            ProductImportPreviewRow.STATUS_DUPLICATE, null, "SKU-1", "Test", null, null, "dup"
        );
        assertEquals(null, linker.linkToAssortment(row, null, 1));
        verify(productRepository, never()).findById(any());
        verify(storeStockService, never()).ensurePresence(any(), any());
    }

    private static ProductImportPreviewRow dupRow(UUID productId, BigDecimal filePrice) {
        return new ProductImportPreviewRow(
            1, "SKU-1", "Test", null, null, null, null, "dona", null, "PIECE", "PCS",
            BigDecimal.TEN, filePrice, null, new BigDecimal("1000"), null,
            ProductImportPreviewRow.STATUS_DUPLICATE, productId, "SKU-1", "Test",
            null, null, "Товар уже есть в базе"
        );
    }
}
