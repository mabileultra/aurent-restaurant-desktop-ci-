package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface StockLotRepository extends JpaRepository<StockLot, UUID> {

    @Query("""
        SELECT l FROM StockLot l
        JOIN FETCH l.product
        WHERE l.product.id = :productId AND l.storeId = :storeId AND l.quantity > 0
        ORDER BY l.expiryDate NULLS LAST, l.createdAt
        """)
    List<StockLot> findAvailableFefo(@Param("productId") UUID productId, @Param("storeId") Integer storeId);

    @Query("""
        SELECT l FROM StockLot l
        JOIN FETCH l.product
        WHERE l.storeId = :storeId AND l.product.id IN :productIds AND l.quantity > 0
        ORDER BY l.product.id, l.expiryDate NULLS LAST, l.createdAt
        """)
    List<StockLot> findAvailableForProducts(
        @Param("storeId") Integer storeId,
        @Param("productIds") Collection<UUID> productIds
    );

    boolean existsByProduct_IdAndStoreIdAndQuantityGreaterThan(UUID productId, Integer storeId, BigDecimal quantity);
}
