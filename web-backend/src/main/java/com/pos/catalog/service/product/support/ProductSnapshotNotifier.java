package com.pos.catalog.service.product.support;

import com.pos.catalog.entity.Product;
import com.pos.service.event.PosDomainEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProductSnapshotNotifier {

    private final ProductCatalogLoader catalogLoader;
    private final PosDomainEventService posDomainEventService;

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
    }
}
