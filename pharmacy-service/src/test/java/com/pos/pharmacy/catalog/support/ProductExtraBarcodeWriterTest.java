package com.pos.pharmacy.catalog.support;

import com.pos.pharmacy.catalog.entity.ProductBarcode;
import com.pos.pharmacy.catalog.repository.ProductBarcodeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class ProductExtraBarcodeWriterTest {

    @Mock
    private ProductBarcodeRepository productBarcodeRepository;
    @Mock
    private PharmacyBarcodeClaim barcodeClaim;

    @InjectMocks
    private ProductExtraBarcodeWriter writer;

    @Test
    void skipsNullBarcodes() {
        writer.replace(UUID.randomUUID(), 1, "111", null);
        verifyNoInteractions(productBarcodeRepository, barcodeClaim);
    }

    @Test
    void replacesExtrasAndSkipsPrimaryDuplicate() {
        UUID productId = UUID.randomUUID();

        writer.replace(productId, 3, "111", List.of("111", "222", " "));

        verify(productBarcodeRepository).deleteByProductId(productId);
        verify(barcodeClaim, never()).claim(3, "111", productId);
        verify(barcodeClaim).claim(3, "222", productId);
        ArgumentCaptor<ProductBarcode> captor = ArgumentCaptor.forClass(ProductBarcode.class);
        verify(productBarcodeRepository).save(captor.capture());
        assertEquals("222", captor.getValue().getBarcode());
        assertEquals(productId, captor.getValue().getProductId());
    }
}
