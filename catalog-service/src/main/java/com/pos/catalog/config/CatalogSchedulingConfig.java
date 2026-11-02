package com.pos.catalog.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "app.outbox.dispatch-enabled", havingValue = "true", matchIfMissing = true)
public class CatalogSchedulingConfig {
}
