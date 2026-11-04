package com.pos.pharmacy.warehouse.repository;

import com.pos.pharmacy.warehouse.entity.StockMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("""
        SELECT m FROM StockMovement m
        WHERE m.companyId = :companyId
          AND m.productId = :productId
          AND (:storeId IS NULL OR m.storeId = :storeId)
        ORDER BY m.createdAt DESC
        """)
    List<StockMovement> findByProduct(
        @Param("companyId") Integer companyId,
        @Param("productId") UUID productId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
