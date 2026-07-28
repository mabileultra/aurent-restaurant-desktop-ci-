package com.pos.inventory.repository.stock;

import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.repository.projection.ProductDispatchedSum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockMovementQueryRepository {

    List<ProductDispatchedSum> sumDispatchedByProductIds(Collection<UUID> productIds);

    long sumDispatchedByProductId(UUID productId);

    Page<StockMovement> findProductMovements(
        UUID productId,
        Instant start,
        Instant end,
        String movementType,
        Integer storeId,
        Pageable pageable
    );

    List<Object[]> findProductMovementTimeline(UUID productId);

    List<Object[]> sumQuantitiesByTypeForProduct(
        UUID productId,
        Instant start,
        Instant end,
        Integer storeId
    );
}
