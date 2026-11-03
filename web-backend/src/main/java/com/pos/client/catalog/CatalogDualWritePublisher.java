package com.pos.client.catalog;

import com.pos.catalog.entity.Product;
import com.pos.config.catalog.CatalogServiceProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Wave 4.3 / 5.4 / 5.7: mirror into catalog-service (DUAL after-commit or REMOTE_ONLY sync).
 */
@Component
@RequiredArgsConstructor
public class CatalogDualWritePublisher {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;
    private final CatalogProductUpsertMapper upsertMapper;
    private final CatalogCategoryUpsertMapper categoryUpsertMapper;
    private final CatalogRemoteWriteSupport remoteWriteSupport;

    public void publishAfterCommit(Product product) {
        if (!properties.dualWriteEnabled() || product == null || product.getId() == null) {
            return;
        }
        if (!product.isActive()) {
            UUID productId = product.getId();
            remoteWriteSupport.run(() -> {
                boolean ok = catalogServiceClient.tryDeactivateProduct(productId);
                remoteWriteSupport.requireOk(ok, "catalog-service product deactivate failed: " + productId);
                if (ok) {
                    CatalogDualWriteTrace.ok(
                        CatalogDualWritePublisher.class, properties, "product-deactivate", productId
                    );
                }
            });
            return;
        }
        CatalogCategoryUpsertRequest categoryPayload = product.getCategory() != null
            ? categoryUpsertMapper.toUpsert(product.getCategory())
            : null;
        CatalogProductUpsertRequest payload = upsertMapper.toUpsert(product);
        if (payload == null) {
            return;
        }
        remoteWriteSupport.run(() -> {
            if (categoryPayload != null) {
                boolean categoryOk = catalogServiceClient.tryUpsertCategory(categoryPayload);
                remoteWriteSupport.requireOk(
                    categoryOk,
                    "catalog-service category upsert failed: " + categoryPayload.id()
                );
                if (categoryOk) {
                    CatalogDualWriteTrace.ok(
                        CatalogDualWritePublisher.class, properties, "category-upsert", categoryPayload.id()
                    );
                }
            }
            boolean productOk = catalogServiceClient.tryUpsertProduct(payload);
            remoteWriteSupport.requireOk(
                productOk,
                "catalog-service product upsert failed: " + payload.id()
            );
            if (productOk) {
                CatalogDualWriteTrace.ok(
                    CatalogDualWritePublisher.class, properties, "product-upsert", payload.id()
                );
            }
        });
    }
}
