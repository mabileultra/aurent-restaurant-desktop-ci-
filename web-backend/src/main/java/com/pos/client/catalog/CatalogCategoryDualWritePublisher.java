package com.pos.client.catalog;

import com.pos.catalog.entity.Category;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.shared.catalog.CatalogLegacyIds;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CatalogCategoryDualWritePublisher {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;
    private final CatalogCategoryUpsertMapper upsertMapper;
    private final CatalogRemoteWriteSupport remoteWriteSupport;

    public void publishAfterCommit(Category category) {
        if (!properties.dualWriteEnabled() || category == null || category.getId() == null) {
            return;
        }
        CatalogCategoryUpsertRequest payload = upsertMapper.toUpsert(category);
        if (payload == null) {
            return;
        }
        remoteWriteSupport.run(() -> {
            boolean ok = catalogServiceClient.tryUpsertCategory(payload);
            remoteWriteSupport.requireOk(ok, "catalog-service category upsert failed: " + payload.id());
            if (ok) {
                CatalogDualWriteTrace.ok(
                    CatalogCategoryDualWritePublisher.class, properties, "category-upsert", payload.id()
                );
            }
        });
    }

    /** Capture legacy ids before local delete; soft-deactivate remote. */
    public void publishDeactivateAfterCommit(Category category) {
        if (!properties.dualWriteEnabled() || category == null || category.getId() == null
            || category.getCompany() == null) {
            return;
        }
        UUID remoteId = CatalogLegacyIds.categoryId(category.getCompany().getId(), category.getId());
        if (remoteId == null) {
            return;
        }
        remoteWriteSupport.run(() -> {
            boolean ok = catalogServiceClient.tryDeactivateCategory(remoteId);
            remoteWriteSupport.requireOk(ok, "catalog-service category deactivate failed: " + remoteId);
            if (ok) {
                CatalogDualWriteTrace.ok(
                    CatalogCategoryDualWritePublisher.class, properties, "category-deactivate", remoteId
                );
            }
        });
    }
}
