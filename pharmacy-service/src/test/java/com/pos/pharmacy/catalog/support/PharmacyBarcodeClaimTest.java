package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyBarcodeClaimTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductBarcodeRepository productBarcodeRepository;

    @InjectMocks
    private PharmacyBarcodeClaim claim;

    @Test
    void ignoresOwnPrimaryBarcode() {
        UUID id = UUID.randomUUID();
        Product self = Product.builder().id(id).companyId(1).active(true).barcode("111").build();
        when(productRepository.findFirstByCompanyIdAndBarcode(1, "111")).thenReturn(Optional.of(self));
        when(productBarcodeRepository.findByBarcode("111")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> claim.claim(1, "111", id));
        verify(productRepository, never()).saveAndFlush(self);
    }

    @Test
    void rejectsActiveForeignBarcode() {
        UUID otherId = UUID.randomUUID();
        Product other = Product.builder().id(otherId).companyId(1).active(true).barcode("111").build();
        when(productRepository.findFirstByCompanyIdAndBarcode(1, "111")).thenReturn(Optional.of(other));

        assertThrows(BusinessException.class, () -> claim.claim(1, "111", UUID.randomUUID()));
    }

    @Test
    void ignoresOwnExtraBarcodeLine() {
        UUID id = UUID.randomUUID();
        ProductBarcode extra = ProductBarcode.builder().id(UUID.randomUUID()).productId(id).barcode("222").build();
        when(productRepository.findFirstByCompanyIdAndBarcode(1, "222")).thenReturn(Optional.empty());
        when(productBarcodeRepository.findByBarcode("222")).thenReturn(Optional.of(extra));

        assertDoesNotThrow(() -> claim.claim(1, "222", id));
        verify(productBarcodeRepository, never()).delete(extra);
    }
}
