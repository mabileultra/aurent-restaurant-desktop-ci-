package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.dto.BulkProductIdsRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.support.PharmacyBarcodeClaim;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductDeactivateServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private PharmacyBarcodeClaim barcodeClaim;
    @Mock
    private TenantSupport tenant;
    @Mock
    private PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @InjectMocks
    private ProductDeactivateService service;

    @Test
    void deactivatesOwnedActiveProduct() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).companyId(7).active(true).build();
        when(tenant.requireCompanyId()).thenReturn(7);
        when(productRepository.findById(id)).thenReturn(Optional.of(product));

        service.deactivate(id);

        verify(barcodeClaim).release(product);
        verify(productRepository).save(product);
        verify(catalogCacheEvictor).onProductChanged(7);
    }

    @Test
    void skipsAlreadyInactive() {
        Product product = Product.builder().id(UUID.randomUUID()).companyId(7).active(false).build();

        service.deactivate(product);

        verify(barcodeClaim, never()).release(product);
        verify(productRepository, never()).save(product);
    }

    @Test
    void bulkDeactivatesOnlyCompanyProducts() {
        UUID ownedId = UUID.randomUUID();
        UUID foreignId = UUID.randomUUID();
        Product owned = Product.builder().id(ownedId).companyId(7).active(true).build();
        Product foreign = Product.builder().id(foreignId).companyId(99).active(true).build();
        when(tenant.requireCompanyId()).thenReturn(7);
        when(productRepository.findAllById(List.of(ownedId, foreignId))).thenReturn(List.of(owned, foreign));

        int updated = service.bulkDeactivate(new BulkProductIdsRequest(List.of(ownedId, foreignId)));

        assertEquals(1, updated);
        verify(barcodeClaim).release(owned);
        verify(barcodeClaim, never()).release(foreign);
        verify(productRepository).saveAll(List.of(owned));
        verify(catalogCacheEvictor).onProductChanged(7);
    }

    @Test
    void bulkRejectsEmptyOwnedSet() {
        UUID id = UUID.randomUUID();
        Product foreign = Product.builder().id(id).companyId(99).active(true).build();
        when(tenant.requireCompanyId()).thenReturn(7);
        when(productRepository.findAllById(List.of(id))).thenReturn(List.of(foreign));

        assertThrows(BusinessException.class, () ->
            service.bulkDeactivate(new BulkProductIdsRequest(List.of(id)))
        );
    }
}
