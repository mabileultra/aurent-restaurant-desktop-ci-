package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.client.catalog.CatalogPrimaryProductSync;
import com.pos.config.catalog.CatalogServiceProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Wave 7 hook for grocery product handlers: assign id + catalog upsert before local save.
 */
@Component
@RequiredArgsConstructor
public class CatalogPrimaryProductWriteSupport {

    private final CatalogServiceProperties properties;
    private final CatalogPrimaryProductSync primaryProductSync;

    public boolean enabled() {
        return properties.catalogPrimaryWrite();
    }

    /**
     * Ensure UUID exists so catalog-service and local mirror share one id.
     * Relies on {@link Product} using assigned ids (no {@code @GeneratedValue}).
     */
    public void ensureId(Product product) {
        if (!enabled() || product == null || product.getId() != null) {
            return;
        }
        product.setId(UUID.randomUUID());
    }

    public void upsertBeforeLocalSave(Product product) {
        if (!enabled()) {
            return;
        }
        ensureId(product);
        primaryProductSync.upsertOrFail(product);
    }

    public void deactivateBeforeLocalSave(UUID productId) {
        if (!enabled()) {
            return;
        }
        primaryProductSync.deactivateOrFail(productId);
    }
}
