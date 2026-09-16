package com.pos.inventory.service.stock.support;

import com.pos.catalog.entity.Product;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.catalog.repository.ProductRepository;
import com.pos.service.support.CatalogIsolationSupport;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockDocumentSupportTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CatalogIsolationSupport catalogIsolation;

    @InjectMocks
    private StockDocumentSupport stockDocument;

    @Test
    void requireLines_empty_throws() {
        assertThrows(BadRequestException.class, () -> stockDocument.requireLines(List.of()));
    }

    @Test
    void requireCompanyContext_null_throws() {
        assertThrows(BadRequestException.class, () -> stockDocument.requireCompanyContext(null));
    }

    @Test
    void requirePositiveQuantity_zero_throws() {
        assertThrows(BadRequestException.class, () -> stockDocument.requirePositiveQuantity(BigDecimal.ZERO));
    }

    @Test
    void requireActiveProduct_notFound_throws() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> stockDocument.requireActiveProduct(id));
    }

    @Test
    void requireActiveProduct_inactive_throws() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().name("Milk").isActive(false).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class, () -> stockDocument.requireActiveProduct(id));
    }

    @Test
    void requireActiveProduct_ok_returnsProduct() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().name("Milk").isActive(true).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));

        Product result = stockDocument.requireActiveProduct(id);

        assertEquals("Milk", result.getName());
    }
}
