package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistryRow;
import com.pos.pharmacy.pricing.registry.entity.PriceRegistrySnapshot;
import com.pos.pharmacy.pricing.registry.exception.PriceLimitExceededException;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistryRowRepository;
import com.pos.pharmacy.pricing.registry.repository.PriceRegistrySnapshotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceLimitSaleValidatorTest {

    @Mock ProductRepository productRepository;
    @Mock PriceRegistrySnapshotRepository snapshotRepository;
    @Mock PriceRegistryRowRepository rowRepository;
    @InjectMocks PriceLimitSaleValidator validator;

    @Test
    void blocksWhenSaleAboveLimit() {
        UUID productId = UUID.randomUUID();
        UUID snapId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .barcode("4780012345678")
            .sellingPrice(new BigDecimal("10000"))
            .build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(snapshotRepository.findFirstByStatusOrderByCreatedAtDesc("READY"))
            .thenReturn(Optional.of(PriceRegistrySnapshot.builder().id(snapId).status("READY").build()));
        when(rowRepository.findFirstBySnapshotIdAndBarcode(snapId, "4780012345678"))
            .thenReturn(Optional.of(PriceRegistryRow.builder()
                .limitPriceVat(new BigDecimal("8000.00"))
                .build()));

        assertThrows(
            PriceLimitExceededException.class,
            () -> validator.checkPriceBeforeSale(productId, new BigDecimal("9000.00"))
        );
    }

    @Test
    void allowsWhenSaleAtOrBelowLimit() {
        UUID productId = UUID.randomUUID();
        UUID snapId = UUID.randomUUID();
        Product product = Product.builder()
            .id(productId)
            .barcode("4780012345678")
            .build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(snapshotRepository.findFirstByStatusOrderByCreatedAtDesc("READY"))
            .thenReturn(Optional.of(PriceRegistrySnapshot.builder().id(snapId).status("READY").build()));
        when(rowRepository.findFirstBySnapshotIdAndBarcode(snapId, "4780012345678"))
            .thenReturn(Optional.of(PriceRegistryRow.builder()
                .limitPriceVat(new BigDecimal("8000.00"))
                .build()));

        assertTrue(validator.checkPriceBeforeSale(productId, new BigDecimal("8000.00")));
    }
}
