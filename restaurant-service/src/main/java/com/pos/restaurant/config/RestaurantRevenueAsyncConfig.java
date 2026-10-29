package com.pos.restaurant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Async pool for post-commit revenue / stock outbox Kafka sends (pay path must not block). */
@Configuration
public class RestaurantRevenueAsyncConfig {

    @Bean(name = RestaurantExecutorNames.REVENUE_OUTBOX)
    public Executor restaurantRevenueOutboxExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("rst-revenue-outbox-");
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(500);
        executor.initialize();
        return executor;
    }
}
