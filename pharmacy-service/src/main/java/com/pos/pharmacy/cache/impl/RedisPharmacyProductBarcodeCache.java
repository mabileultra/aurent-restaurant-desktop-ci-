package com.pos.pharmacy.cache.impl;

import com.pos.pharmacy.cache.PharmacyBarcodeCacheKeys;
import com.pos.pharmacy.cache.PharmacyProductBarcodeCache;
import com.pos.pharmacy.catalog.dto.ProductResponse;
import com.pos.pharmacy.config.PharmacyRedisProperties;
import com.pos.shared.log.LogUtil;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(prefix = "app.pharmacy.redis", name = "enabled", havingValue = "true")
public class RedisPharmacyProductBarcodeCache implements PharmacyProductBarcodeCache {

    private static final int SCAN_COUNT = 200;
    private static final int JITTER_MAX_SECONDS = 15;

    private final RedisTemplate<String, ProductResponse> productResponseRedisTemplate;
    private final PharmacyRedisProperties properties;

    public RedisPharmacyProductBarcodeCache(
        RedisTemplate<String, ProductResponse> productResponseRedisTemplate,
        PharmacyRedisProperties properties
    ) {
        this.productResponseRedisTemplate = productResponseRedisTemplate;
        this.properties = properties;
    }

    @Override
    public ProductResponse getOrLoad(
        Integer companyId,
        Integer storeId,
        String rawBarcode,
        Supplier<ProductResponse> loader
    ) {
        if (companyId == null || storeId == null || !StringUtils.hasText(rawBarcode)) {
            return loader.get();
        }
        List<String> keys = PharmacyBarcodeCacheKeys.keysForScan(companyId, storeId, rawBarcode);
        for (String key : keys) {
            ProductResponse hit = tryGet(key);
            if (hit != null) {
                return hit;
            }
        }
        ProductResponse loaded = loader.get();
        putAll(keys, loaded);
        if (loaded != null && StringUtils.hasText(loaded.barcode())) {
            putAll(List.of(PharmacyBarcodeCacheKeys.of(companyId, storeId, loaded.barcode())), loaded);
        }
        return loaded;
    }

    @Override
    public void evictStore(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return;
        }
        deleteByPrefix(PharmacyBarcodeCacheKeys.storePrefix(companyId, storeId));
    }

    @Override
    public void evictCompany(Integer companyId) {
        if (companyId == null) {
            return;
        }
        deleteByPrefix(PharmacyBarcodeCacheKeys.companyPrefix(companyId));
    }

    private ProductResponse tryGet(String key) {
        try {
            return productResponseRedisTemplate.opsForValue().get(key);
        } catch (Exception ex) {
            LogUtil.debug(RedisPharmacyProductBarcodeCache.class, "Redis get miss/fallback key={}", key);
            return null;
        }
    }

    private void putAll(List<String> keys, ProductResponse value) {
        if (value == null || keys == null || keys.isEmpty()) {
            return;
        }
        Duration ttl = ttlWithJitter();
        for (String key : keys) {
            try {
                productResponseRedisTemplate.opsForValue().set(key, value, ttl);
            } catch (Exception ex) {
                LogUtil.debug(RedisPharmacyProductBarcodeCache.class, "Redis put skipped key={}", key);
            }
        }
    }

    private Duration ttlWithJitter() {
        int base = Math.max(30, properties.getBarcodeTtlSeconds());
        int jitter = ThreadLocalRandom.current().nextInt(0, JITTER_MAX_SECONDS + 1);
        return Duration.ofSeconds(base + jitter);
    }

    private void deleteByPrefix(String prefix) {
        try {
            Set<String> keys = new HashSet<>();
            ScanOptions options = ScanOptions.scanOptions().match(prefix + '*').count(SCAN_COUNT).build();
            try (var cursor = productResponseRedisTemplate.scan(options)) {
                while (cursor.hasNext()) {
                    keys.add(cursor.next());
                    if (keys.size() >= 500) {
                        productResponseRedisTemplate.delete(keys);
                        keys.clear();
                    }
                }
            }
            if (!keys.isEmpty()) {
                productResponseRedisTemplate.delete(keys);
            }
        } catch (Exception ex) {
            LogUtil.warn(RedisPharmacyProductBarcodeCache.class, "Redis evict fallback prefix={}", prefix);
        }
    }
}
