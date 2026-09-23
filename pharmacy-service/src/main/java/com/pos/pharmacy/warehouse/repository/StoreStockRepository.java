package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StoreStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoreStockRepository extends JpaRepository<StoreStock, StoreStock.StoreStockId> {

    Optional<StoreStock> findByProductIdAndStoreId(UUID productId, Integer storeId);

    List<StoreStock> findByStoreIdAndProductIdIn(Integer storeId, Collection<UUID> productIds);

    @Query("""
        SELECT s.productId, COALESCE(SUM(s.quantity), 0)
        FROM StoreStock s
        WHERE s.productId IN :productIds
        GROUP BY s.productId
        """)
    List<Object[]> sumByProductIds(@Param("productIds") Collection<UUID> productIds);
}
