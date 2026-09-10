package com.pos.platform.service.support;

import com.pos.platform.config.BillingCacheConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

import static org.assertj.core.api.Assertions.assertThat;

class BillingAccessCacheTest {

    private BillingAccessCache cache;
    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        cacheManager = new BillingCacheConfig().cacheManager();
        ((org.springframework.cache.support.SimpleCacheManager) cacheManager).initializeCaches();
        cache = new BillingAccessCache(cacheManager);
    }

    @Test
    void evict_removesCompanyKey() {
        cacheManager.getCache(BillingAccessCache.CACHE_NAME).put(5, "blocked");
        assertThat(cacheManager.getCache(BillingAccessCache.CACHE_NAME).get(5)).isNotNull();

        cache.evict(5);

        assertThat(cacheManager.getCache(BillingAccessCache.CACHE_NAME).get(5)).isNull();
    }

    @Test
    void plansAndAccessCachesAreSeparate() {
        assertThat(cacheManager.getCache(BillingCacheConfig.BILLING_ACCESS)).isNotNull();
        assertThat(cacheManager.getCache(BillingCacheConfig.BILLING_PLANS)).isNotNull();
        cacheManager.getCache(BillingCacheConfig.BILLING_PLANS).put(true, "plans");
        cache.evictAll();
        assertThat(cacheManager.getCache(BillingCacheConfig.BILLING_PLANS).get(true)).isNotNull();
        assertThat(cacheManager.getCache(BillingCacheConfig.BILLING_ACCESS).get(1)).isNull();
    }
}
