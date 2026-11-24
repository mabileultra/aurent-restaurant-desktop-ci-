package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductBarcodeRepository;
import com.pos.catalog.repository.ProductRepository;
import com.pos.scales.codec.WeightBarcodeCodec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductByScanVariantsFinderTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductBarcodeRepository productBarcodeRepository;
    @Mock
    private WeightBarcodeCodec weightBarcodeCodec;

    @InjectMocks
    private ProductByScanVariantsFinder finder;

    @Test
    void findsByPrimaryBarcodeInOneInQuery() {
        Product product = new Product();
        product.setId(UUID.randomUUID());
        when(productRepository.findFirstByCompany_IdAndBarcodeIn(eq(7), any()))
            .thenReturn(Optional.of(product));

        Optional<Product> hit = finder.find(7, "4780131183006");

        assertThat(hit).contains(product);
        verify(productRepository).findFirstByCompany_IdAndBarcodeIn(eq(7), any());
    }
}
