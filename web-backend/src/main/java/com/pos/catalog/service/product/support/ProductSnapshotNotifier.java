package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.client.catalog.CatalogDualWritePublisher;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.service.event.PosDomainEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Desktop/Kafka product snapshot + optional catalog mirror.
 * Under {@code CATALOG_PRIMARY}, remote card write is done by
 * {@link com.pos.client.catalog.CatalogPrimaryProductSync} before local save — not here.
 */
@Component
@RequiredArgsConstructor
public class ProductSnapshotNotifier {

    private final ProductCatalogLoader catalogLoader;
    private final PosDomainEventService posDomainEventService;
    private final CatalogDualWritePublisher catalogDualWritePublisher;
    private final CatalogServiceProperties catalogProperties;

    public void notify(UUID productId) {
        if (productId == null) {
            return;
        }
        notify(catalogLoader.requireDetailed(productId));
    }

    public void notify(Product product) {
        if (product == null || product.getId() == null) {
            return;
        }
        posDomainEventService.publishProductSnapshotAfterCommit(product);
        if (catalogProperties.catalogPrimaryWrite()) {
            return;
        }
        catalogDualWritePublisher.publishAfterCommit(product);
    }
}
