package com.pos.inventory.repository;

import com.pos.inventory.entity.StockLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockLotRepository extends JpaRepository<StockLot, UUID> {

    @Query("""
        SELECT l FROM StockLot l
        WHERE l.product.id = :productId
          AND l.store.id = :storeId
          AND l.quantity > 0
        ORDER BY CASE WHEN l.expiryDate IS NULL THEN 1 ELSE 0 END,
                 l.expiryDate ASC,
                 l.createdAt ASC
        """)
    List<StockLot> findAvailableFefo(
        @Param("productId") UUID productId,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT l FROM StockLot l
        WHERE l.store.id = :storeId
          AND l.product.id IN :productIds
          AND l.quantity > 0
        ORDER BY l.product.id,
                 CASE WHEN l.expiryDate IS NULL THEN 1 ELSE 0 END,
                 l.expiryDate ASC,
                 l.createdAt ASC
        """)
    List<StockLot> findAvailableForProducts(
        @Param("storeId") Integer storeId,
        @Param("productIds") Collection<UUID> productIds
    );

    boolean existsByProduct_IdAndStore_IdAndQuantityGreaterThan(
        UUID productId,
        Integer storeId,
        java.math.BigDecimal quantity
    );
}
