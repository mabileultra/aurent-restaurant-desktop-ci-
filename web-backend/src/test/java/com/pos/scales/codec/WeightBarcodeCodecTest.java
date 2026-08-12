package com.pos.scales.codec;

import com.pos.catalog.service.product.support.ProductPluValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WeightBarcodeCodecTest {

    private WeightBarcodeCodec codec;

    @BeforeEach
    void setUp() {
        codec = new WeightBarcodeCodec(new ProductPluValidator());
    }

    @Test
    void encodeDecodeRoundTrip() {
        String barcode = codec.encode("12", new BigDecimal("1.250"));
        assertEquals(13, barcode.length());
        assertTrue(barcode.startsWith("20"));

        var decoded = codec.tryDecode(barcode);
        assertTrue(decoded.isPresent());
        assertEquals("12", decoded.get().plu());
        assertEquals(0, new BigDecimal("1.250").compareTo(decoded.get().weightKg()));
    }
}
