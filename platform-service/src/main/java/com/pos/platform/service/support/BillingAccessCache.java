package com.pos.platform.service.support;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

@Component
public class BillingAccessCache {

    public static final String CACHE_NAME = "billingAccess";

    private final CacheManager cacheManager;

    public BillingAccessCache(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public void evict(Integer companyId) {
        if (companyId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.evict(companyId);
        }
    }

    public void evictAll() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) {
            cache.clear();
        }
    }
}
