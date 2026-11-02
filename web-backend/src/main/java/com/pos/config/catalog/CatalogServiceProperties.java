package com.pos.config.catalog;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Outbound client to catalog-service.
 * Keep {@code enabled=false} until dual-write/backfill/verify are green.
 */
@Component
@ConfigurationProperties(prefix = "app.catalog")
@Getter
@Setter
public class CatalogServiceProperties {

    /** Master switch for remote client, dual-write, backfill, verify. */
    private boolean enabled = false;

    /**
     * Facade read strategy when {@link #enabled} is true.
     * When disabled, behavior is always {@link CatalogReadMode#LOCAL_ONLY}.
     */
    private CatalogReadMode readMode = CatalogReadMode.REMOTE_FIRST;

    /**
     * Dual-write strategy when {@link #enabled} is true.
     * When disabled, behavior is always {@link CatalogWriteMode#LOCAL_ONLY}.
     */
    private CatalogWriteMode writeMode = CatalogWriteMode.DUAL;

    private String baseUrl = "http://localhost:8090/api/v1";
    private String internalApiKey = "catalog-internal-dev-key-change-in-prod";
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 8000;

    public CatalogReadMode effectiveReadMode() {
        if (!enabled) {
            return CatalogReadMode.LOCAL_ONLY;
        }
        return readMode != null ? readMode : CatalogReadMode.REMOTE_FIRST;
    }

    public CatalogWriteMode effectiveWriteMode() {
        if (!enabled) {
            return CatalogWriteMode.LOCAL_ONLY;
        }
        return writeMode != null ? writeMode : CatalogWriteMode.DUAL;
    }

    public boolean dualWriteEnabled() {
        CatalogWriteMode mode = effectiveWriteMode();
        return mode == CatalogWriteMode.DUAL || mode == CatalogWriteMode.REMOTE_ONLY;
    }

    public boolean strictRemoteWrite() {
        return effectiveWriteMode() == CatalogWriteMode.REMOTE_ONLY;
    }
}
