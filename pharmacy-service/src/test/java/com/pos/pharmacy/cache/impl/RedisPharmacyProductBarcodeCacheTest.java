package com.pos.pharmacy.cache.impl;

import com.pos.pharmacy.cache.PharmacyBarcodeCacheKeys;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.config.PharmacyRedisProperties;
import com.pos.pharmacy.domain.ProductType;
import com.pos.pharmacy.domain.SaleType;
import com.pos.pharmacy.domain.UnitCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RedisPharmacyProductBarcodeCacheTest {

    @Mock
    private RedisTemplate<String, ProductResponse> redisTemplate;
    @Mock
    private ValueOperations<String, ProductResponse> valueOps;

    private RedisPharmacyProductBarcodeCache cache;

    @BeforeEach
    void setUp() {
        PharmacyRedisProperties properties = new PharmacyRedisProperties();
        properties.setBarcodeTtlSeconds(180);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        cache = new RedisPharmacyProductBarcodeCache(redisTemplate, properties);
    }

    @Test
    void returnsHitWithoutCallingLoader() {
        ProductResponse cached = sampleProduct("HIT");
        String key = PharmacyBarcodeCacheKeys.of(10, 5, "4601234567890");
        when(valueOps.get(key)).thenReturn(cached);

        AtomicInteger loads = new AtomicInteger();
        ProductResponse result = cache.getOrLoad(10, 5, "4601234567890", () -> {
            loads.incrementAndGet();
            return sampleProduct("DB");
        });

        assertSame(cached, result);
        assertEquals(0, loads.get());
        verify(valueOps, never()).set(anyString(), any(), any());
    }

    @Test
    void loadsFromDbOnMissAndPuts() {
        when(valueOps.get(anyString())).thenReturn(null);
        ProductResponse loaded = sampleProduct("DB");

        ProductResponse result = cache.getOrLoad(10, 5, "4601234567890", () -> loaded);

        assertSame(loaded, result);
        verify(valueOps, atLeastOnce()).set(anyString(), eq(loaded), any());
    }

    @Test
    void fallsBackToDbWhenRedisGetFails() {
        when(valueOps.get(anyString())).thenThrow(new RuntimeException("redis down"));
        ProductResponse loaded = sampleProduct("DB");

        ProductResponse result = cache.getOrLoad(10, 5, "4601234567890", () -> loaded);

        assertSame(loaded, result);
    }

    @Test
    void stillReturnsDbValueWhenRedisPutFails() {
        when(valueOps.get(anyString())).thenReturn(null);
        org.mockito.Mockito.doThrow(new RuntimeException("redis put fail"))
            .when(valueOps).set(anyString(), any(), any());
        ProductResponse loaded = sampleProduct("DB");

        ProductResponse result = cache.getOrLoad(10, 5, "4601234567890", () -> loaded);

        assertSame(loaded, result);
    }

    private static ProductResponse sampleProduct(String name) {
        return new ProductResponse(
            UUID.randomUUID(),
            "SKU-1",
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
            "4601234567890",
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
