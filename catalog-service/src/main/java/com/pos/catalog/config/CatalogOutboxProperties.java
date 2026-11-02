package com.pos.catalog.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.outbox")
@Getter
@Setter
public class CatalogOutboxProperties {

    /** logging (default) | kafka (future) */
    private String transport = "logging";

    private boolean dispatchEnabled = true;

    /** Spring cron; default every 15s. */
    private String dispatchCron = "*/15 * * * * *";

    private int batchSize = 50;
}
