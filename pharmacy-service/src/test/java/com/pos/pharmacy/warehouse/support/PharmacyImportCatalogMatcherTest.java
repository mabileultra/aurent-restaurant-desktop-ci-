package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyImportCatalogMatcherTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductBarcodeRepository productBarcodeRepository;

    @InjectMocks
    private PharmacyImportCatalogMatcher matcher;

    @Test
    void prefersActiveWhenBarcodeDuplicated() {
        Product inactive = Product.builder()
            .id(UUID.randomUUID()).companyId(1).active(false).barcode("460123").name("Old").build();
        Product active = Product.builder()
            .id(UUID.randomUUID()).companyId(1).active(true).barcode("460123").name("Live").build();
        when(productRepository.findByCompanyIdAndBarcodeIn(eq(1), any()))
            .thenReturn(List.of(inactive, active));

        Optional<Product> found = matcher.findExisting(1, "460123");
        assertTrue(found.isPresent());
        assertEquals(active.getId(), found.get().getId());
    }

    @Test
    void barcodeTakenTrueOnDuplicates() {
        when(productRepository.findByCompanyIdAndBarcodeIn(1, List.of("460123")))
            .thenReturn(List.of(
                Product.builder().id(UUID.randomUUID()).companyId(1).barcode("460123").build(),
                Product.builder().id(UUID.randomUUID()).companyId(1).barcode("460123").build()
            ));
        assertTrue(matcher.barcodeTaken(1, "460123"));
    }

    @Test
    void findsByIkpuWhenBarcodeMissing() {
        Product byIkpu = Product.builder()
            .id(UUID.randomUUID()).companyId(1).active(true).ikpu("03304001003000000").name("A").build();
        when(productRepository.findByCompanyIdAndIkpuIn(1, List.of("03304001003000000")))
            .thenReturn(List.of(byIkpu));

        Optional<Product> found = matcher.findExisting(1, null, "03304001003000000");
        assertTrue(found.isPresent());
        assertEquals(byIkpu.getId(), found.get().getId());
    }
}
