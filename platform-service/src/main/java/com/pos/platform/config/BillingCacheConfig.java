package com.pos.platform.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class BillingCacheConfig {

    public static final String BILLING_ACCESS = "billingAccess";
    public static final String BILLING_PLANS = "billingPlans";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
            new CaffeineCache(
                BILLING_ACCESS,
                Caffeine.newBuilder()
                    .maximumSize(10_000)
                    .expireAfterWrite(30, TimeUnit.SECONDS)
                    .recordStats()
                    .build()
            ),
            new CaffeineCache(
                BILLING_PLANS,
                Caffeine.newBuilder()
                    .maximumSize(64)
                    .expireAfterWrite(5, TimeUnit.MINUTES)
                    .recordStats()
                    .build()
            )
        ));
        return manager;
    }
}
