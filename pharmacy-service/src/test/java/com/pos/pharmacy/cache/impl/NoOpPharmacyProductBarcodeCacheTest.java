package com.pos.pharmacy.cache.impl;

import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class NoOpPharmacyProductBarcodeCacheTest {

    @Test
    void alwaysLoadsFromSupplier() {
        NoOpPharmacyProductBarcodeCache cache = new NoOpPharmacyProductBarcodeCache();
        ProductResponse expected = sample("A");
        AtomicInteger loads = new AtomicInteger();

        ProductResponse result = cache.getOrLoad(1, 2, "123", () -> {
            loads.incrementAndGet();
            return expected;
        });

        assertSame(expected, result);
        assertEquals(1, loads.get());
        cache.evictStore(1, 2);
        cache.evictCompany(1);
    }

    private static ProductResponse sample(String name) {
        return new ProductResponse(
            UUID.randomUUID(),
            "SKU",
            name,
            null,
            null,
            null,
            BigDecimal.ONE,
            BigDecimal.TEN,
            BigDecimal.ZERO,
            new BigDecimal("12"),
            ProductType.RETAIL,
            SaleType.PIECE,
            UnitCode.PCS,
            0,
            false,
            BigDecimal.ONE,
            0,
            10,
            false,
            "123",
            null,
            List.of(),
            null,
            true,
            Instant.parse("2026-01-01T00:00:00Z"),
            null,
            null,
            null,
            null,
            null,
            null,
            true,
            false,
            null,
            null,
            null,
            null,
            0,
            List.of(),
            null,
            null,
            Map.of()
        );
    }
}
