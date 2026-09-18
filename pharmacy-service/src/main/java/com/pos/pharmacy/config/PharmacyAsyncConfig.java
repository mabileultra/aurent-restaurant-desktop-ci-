package com.pos.pharmacy.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@EnableConfigurationProperties(PharmacyAsyncProperties.class)
public class PharmacyAsyncConfig {

    @Bean(name = PharmacyExecutorNames.MARK_VERIFY)
    public Executor pharmacyMarkVerifyExecutor(PharmacyAsyncProperties properties) {
        return PharmacyThreadPoolFactory.create(properties.getMarkVerify(), PharmacyAsyncConfig.class);
    }

    @Bean(name = PharmacyExecutorNames.MARK_WITHDRAW)
    public Executor pharmacyMarkWithdrawExecutor(PharmacyAsyncProperties properties) {
        return PharmacyThreadPoolFactory.create(properties.getMarkWithdraw(), PharmacyAsyncConfig.class);
    }

    @Bean(name = PharmacyExecutorNames.IMPORT)
    public Executor pharmacyImportExecutor(PharmacyAsyncProperties properties) {
        return PharmacyThreadPoolFactory.create(properties.getImportPool(), PharmacyAsyncConfig.class);
    }

    @Bean(name = PharmacyExecutorNames.CATALOG)
    public Executor pharmacyCatalogExecutor(PharmacyAsyncProperties properties) {
        return PharmacyThreadPoolFactory.create(properties.getCatalog(), PharmacyAsyncConfig.class);
    }

    @Bean(name = PharmacyExecutorNames.REVENUE_OUTBOX)
    public Executor pharmacyRevenueOutboxExecutor(PharmacyAsyncProperties properties) {
        return PharmacyThreadPoolFactory.create(properties.getRevenueOutbox(), PharmacyAsyncConfig.class);
    }
}
