package com.pos.restaurant.config;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

/** Explicit eviction for floor/menu after writes (TTL alone is a safety net). */
@Component
@RequiredArgsConstructor
public class RestaurantHotCache {

    private final CacheManager cacheManager;

    public void evictFloor(Integer companyId, Integer storeId) {
        if (storeId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(RestaurantCacheNames.FLOOR);
        if (cache == null) {
            return;
        }
        if (companyId != null) {
            cache.evict(companyId + ":" + storeId);
        }
        cache.evict(storeId);
    }

    public void evictMenu(Integer storeId) {
        if (storeId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(RestaurantCacheNames.MENU);
        if (cache == null) {
            return;
        }
        cache.evict(storeId + ":true");
        cache.evict(storeId + ":false");
    }

    public void evictKitchenBoard(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(RestaurantCacheNames.KITCHEN_BOARD);
        if (cache != null) {
            cache.evict(companyId + ":" + storeId);
        }
    }
}
