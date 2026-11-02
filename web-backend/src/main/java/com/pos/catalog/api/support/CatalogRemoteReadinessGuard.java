package com.pos.catalog.api.support;

import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogReadMode;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Wave 7: under {@link CatalogReadMode#REMOTE_ONLY}, admin catalog reads must not
 * silently serve local SoT when catalog-service is down.
 */
@Component
@RequiredArgsConstructor
public class CatalogRemoteReadinessGuard {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;

    public void requireReachableForRemoteOnlyReads() {
        if (!properties.isEnabled()) {
            return;
        }
        if (properties.effectiveReadMode() != CatalogReadMode.REMOTE_ONLY) {
            return;
        }
        if (catalogServiceClient.fetchStats(null).isEmpty()) {
            throw new ServiceUnavailableException(
                "catalog-service unavailable (REMOTE_ONLY read)"
            );
        }
    }
}
