package com.pos.client.catalog;

import com.pos.catalog.entity.Product;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.exception.PosExceptions;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Wave 7: sync grocery product card to catalog-service <em>before</em> local mirror save.
 * Fail-fast — never best-effort.
 */
@Component
@RequiredArgsConstructor
public class CatalogPrimaryProductSync {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;
    private final CatalogProductUpsertMapper upsertMapper;
    private final CatalogCategoryUpsertMapper categoryUpsertMapper;

    public void upsertOrFail(Product product) {
        requirePrimary();
        if (product == null || product.getId() == null) {
            throw PosExceptions.badRequest(
                "catalog primary write requires product id",
                "catalog.write-mode",
                "CATALOG_PRIMARY"
            );
        }
        if (!product.isActive()) {
            deactivateOrFail(product.getId());
            return;
        }
        CatalogCategoryUpsertRequest categoryPayload = product.getCategory() != null
            ? categoryUpsertMapper.toUpsert(product.getCategory())
            : null;
        CatalogProductUpsertRequest payload = upsertMapper.toUpsert(product);
        if (payload == null) {
            throw PosExceptions.badRequest(
                "catalog primary upsert payload missing",
                "catalog.write-mode",
                "CATALOG_PRIMARY"
            );
        }
        if (categoryPayload != null) {
            boolean categoryOk = catalogServiceClient.tryUpsertCategory(categoryPayload);
            requireOk(categoryOk, "catalog-service category upsert failed: " + categoryPayload.id());
        }
        boolean productOk = catalogServiceClient.tryUpsertProduct(payload);
        requireOk(productOk, "catalog-service product upsert failed: " + payload.id());
        LogUtil.info(
            CatalogPrimaryProductSync.class,
            "catalog primary product-upsert id={} writeMode=CATALOG_PRIMARY",
            payload.id()
        );
    }

    public void deactivateOrFail(UUID productId) {
        requirePrimary();
        if (productId == null) {
            throw PosExceptions.badRequest(
                "catalog primary deactivate requires product id",
                "catalog.write-mode",
                "CATALOG_PRIMARY"
            );
        }
        boolean ok = catalogServiceClient.tryDeactivateProduct(productId);
        requireOk(ok, "catalog-service product deactivate failed: " + productId);
        LogUtil.info(
            CatalogPrimaryProductSync.class,
            "catalog primary product-deactivate id={} writeMode=CATALOG_PRIMARY",
            productId
        );
    }

    private void requirePrimary() {
        if (!properties.catalogPrimaryWrite()) {
            throw PosExceptions.badRequest(
                "catalog primary sync called while write-mode is not CATALOG_PRIMARY",
                "catalog.write-mode",
                String.valueOf(properties.effectiveWriteMode())
            );
        }
    }

    private static void requireOk(boolean ok, String message) {
        if (!ok) {
            throw PosExceptions.badRequest(message, "catalog.write-mode", "CATALOG_PRIMARY");
        }
    }
}
