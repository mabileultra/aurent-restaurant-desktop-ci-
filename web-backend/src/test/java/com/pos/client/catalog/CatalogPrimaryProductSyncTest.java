package com.pos.client.catalog;

import com.pos.catalog.entity.Product;
import com.pos.entity.Company;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.config.catalog.CatalogWriteMode;
import com.pos.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogPrimaryProductSyncTest {

    @Mock
    CatalogServiceClient catalogServiceClient;
    @Mock
    CatalogProductUpsertMapper upsertMapper;
    @Mock
    CatalogCategoryUpsertMapper categoryUpsertMapper;

    CatalogServiceProperties properties;
    CatalogPrimaryProductSync sync;

    @BeforeEach
    void setUp() {
        properties = new CatalogServiceProperties();
        properties.setEnabled(true);
        properties.setWriteMode(CatalogWriteMode.CATALOG_PRIMARY);
        sync = new CatalogPrimaryProductSync(
            properties,
            catalogServiceClient,
            upsertMapper,
            categoryUpsertMapper
        );
    }

    @Test
    void upsertFailsWhenRemoteRejects() {
        Product product = activeProduct();
        CatalogProductUpsertRequest payload = payload(product.getId());
        when(upsertMapper.toUpsert(product)).thenReturn(payload);
        when(catalogServiceClient.tryUpsertProduct(payload)).thenReturn(false);

        assertThrows(BadRequestException.class, () -> sync.upsertOrFail(product));
        verify(catalogServiceClient).tryUpsertProduct(payload);
    }

    @Test
    void upsertSucceedsWithoutCategory() {
        Product product = activeProduct();
        CatalogProductUpsertRequest payload = payload(product.getId());
        when(upsertMapper.toUpsert(product)).thenReturn(payload);
        when(catalogServiceClient.tryUpsertProduct(payload)).thenReturn(true);

        sync.upsertOrFail(product);

        verify(catalogServiceClient).tryUpsertProduct(payload);
        verify(catalogServiceClient, never()).tryUpsertCategory(any());
    }

    @Test
    void rejectsWhenNotPrimaryMode() {
        properties.setWriteMode(CatalogWriteMode.DUAL);
        Product product = activeProduct();

        assertThrows(BadRequestException.class, () -> sync.upsertOrFail(product));
        verify(catalogServiceClient, never()).tryUpsertProduct(any());
    }

    @Test
    void deactivateCallsRemote() {
        UUID id = UUID.randomUUID();
        when(catalogServiceClient.tryDeactivateProduct(id)).thenReturn(true);

        sync.deactivateOrFail(id);

        verify(catalogServiceClient).tryDeactivateProduct(id);
    }

    private static Product activeProduct() {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setActive(true);
        Company company = new Company();
        company.setId(1);
        product.setCompany(company);
        return product;
    }

    private static CatalogProductUpsertRequest payload(UUID id) {
        return new CatalogProductUpsertRequest(
            id, 1, "sku", "name", null, null,
            null, null, null, null,
            "RETAIL", "PIECE", "PCS", 0, false, 10,
            null, java.util.List.of(), null, null, true,
            null, null, null, "pcs", true, false, null, null
        );
    }
}
