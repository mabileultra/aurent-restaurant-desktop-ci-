package com.pos.pharmacy.catalog.service;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductBarcodeLookupServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductBarcodeRepository productBarcodeRepository;

    @InjectMocks
    private ProductBarcodeLookupService service;

    @Test
    void findsPrimaryBarcodeInSingleQuery() {
        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .companyId(10)
            .barcode("4780012345678")
            .name("Test")
            .build();
        when(productRepository.findByCompanyIdAndBarcodeIn(eq(10), any()))
            .thenReturn(List.of(product));

        Product found = service.findByScan(10, "4780012345678");
        assertEquals(productId, found.getId());
    }

    @Test
    void findsExtraBarcodeWhenPrimaryMissing() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findByCompanyIdAndBarcodeIn(eq(10), any())).thenReturn(List.of());
        when(productBarcodeRepository.findByBarcodeIn(any())).thenReturn(List.of(
            ProductBarcode.builder().productId(productId).barcode("111").build()
        ));
        when(productRepository.findAllById(any())).thenReturn(List.of(
            Product.builder().id(productId).companyId(10).name("Extra").build()
        ));

        Product found = service.findByScan(10, "111");
        assertEquals(productId, found.getId());
    }

    @Test
    void findsByIkpuWhenBarcodeMissing() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findByCompanyIdAndBarcodeIn(eq(10), any())).thenReturn(List.of());
        when(productBarcodeRepository.findByBarcodeIn(any())).thenReturn(List.of());
        when(productRepository.findByCompanyIdAndIkpuIn(eq(10), any())).thenReturn(List.of(
            Product.builder()
                .id(productId)
                .companyId(10)
                .ikpu("03305005001000000")
                .name("By IKPU")
                .build()
        ));

        Product found = service.findByScan(10, "03305005001000000");
        assertEquals(productId, found.getId());
    }

    @Test
    void throwsWhenNotFound() {
        when(productRepository.findByCompanyIdAndBarcodeIn(eq(10), any())).thenReturn(List.of());
        when(productBarcodeRepository.findByBarcodeIn(any())).thenReturn(List.of());
        when(productRepository.findByCompanyIdAndIkpuIn(eq(10), any())).thenReturn(List.of());
        assertThrows(NotFoundException.class, () -> service.findByScan(10, "999"));
    }
}
