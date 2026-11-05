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
     * Write strategy when {@link #enabled} is true.
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

    /**
     * Mirror-after-local path ({@link CatalogWriteMode#DUAL} / {@link CatalogWriteMode#REMOTE_ONLY}).
     * Not used for {@link CatalogWriteMode#CATALOG_PRIMARY} (that writes remote first).
     */
    public boolean dualWriteEnabled() {
        CatalogWriteMode mode = effectiveWriteMode();
        return mode == CatalogWriteMode.DUAL || mode == CatalogWriteMode.REMOTE_ONLY;
    }

    /** Wave 7: grocery card SoT is catalog-service; local is mirror. */
    public boolean catalogPrimaryWrite() {
        return effectiveWriteMode() == CatalogWriteMode.CATALOG_PRIMARY;
    }

    /** Category (and other) outbound writers that are not the product primary path. */
    public boolean outboundCatalogWriteEnabled() {
        return dualWriteEnabled() || catalogPrimaryWrite();
    }

    /**
     * Fail the request if remote write fails.
     * True for strict mirror ({@code REMOTE_ONLY}) and Wave 7 primary ({@code CATALOG_PRIMARY}).
     */
    public boolean strictRemoteWrite() {
        CatalogWriteMode mode = effectiveWriteMode();
        return mode == CatalogWriteMode.REMOTE_ONLY || mode == CatalogWriteMode.CATALOG_PRIMARY;
    }
}
