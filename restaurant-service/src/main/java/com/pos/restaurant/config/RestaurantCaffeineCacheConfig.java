package com.pos.restaurant.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/** Default: in-process Caffeine when Redis is off. */
@Configuration
@EnableCaching
@ConditionalOnProperty(prefix = "app.restaurant.redis", name = "enabled", havingValue = "false", matchIfMissing = true)
public class RestaurantCaffeineCacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
            new CaffeineCache(
                RestaurantCacheNames.MENU,
                Caffeine.newBuilder()
                    .maximumSize(1_000)
                    .expireAfterWrite(10, TimeUnit.MINUTES)
                    .recordStats()
                    .build()
            ),
            new CaffeineCache(
                RestaurantCacheNames.FLOOR,
                Caffeine.newBuilder()
                    .maximumSize(500)
                    .expireAfterWrite(3, TimeUnit.SECONDS)
                    .recordStats()
                    .build()
            ),
            new CaffeineCache(
                RestaurantCacheNames.KITCHEN_BOARD,
                Caffeine.newBuilder()
                    .maximumSize(500)
                    .expireAfterWrite(30, TimeUnit.SECONDS)
                    .recordStats()
                    .build()
            )
        ));
        return manager;
    }
}
