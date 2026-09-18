package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.cache.PharmacyCatalogCacheEvictor;
import com.pos.pharmacy.catalog.dto.BulkTaxRateRequest;
import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductTaxBulkServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private TenantSupport tenant;
    @Mock
    private PharmacyCatalogCacheEvictor catalogCacheEvictor;

    @InjectMocks
    private ProductTaxBulkService service;

    @Test
    void updatesTaxRateForCompanyProducts() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
            .id(id)
            .companyId(10)
            .name("A")
            .taxRate(new BigDecimal("12.00"))
            .build();
        when(tenant.requireCompanyId()).thenReturn(10);
        when(productRepository.findAllById(List.of(id))).thenReturn(List.of(product));

        int updated = service.bulkUpdateTaxRate(new BulkTaxRateRequest(List.of(id), new BigDecimal("0")));

        assertEquals(1, updated);
        assertEquals(0, product.getTaxRate().compareTo(BigDecimal.ZERO.setScale(2)));
        verify(productRepository).saveAll(anyList());
        verify(catalogCacheEvictor).onProductChanged(10);
    }

    @Test
    void rejectsEmptyOwnedSet() {
        UUID id = UUID.randomUUID();
        Product foreign = Product.builder().id(id).companyId(99).name("X").build();
        when(tenant.requireCompanyId()).thenReturn(10);
        when(productRepository.findAllById(List.of(id))).thenReturn(List.of(foreign));

        assertThrows(BusinessException.class, () ->
            service.bulkUpdateTaxRate(new BulkTaxRateRequest(List.of(id), new BigDecimal("12")))
        );
    }
}
