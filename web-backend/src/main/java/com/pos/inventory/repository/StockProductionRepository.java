package com.pos.inventory.repository;

import com.pos.inventory.entity.StockProduction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StockProductionRepository extends JpaRepository<StockProduction, UUID> {

    long countByCreatedAtGreaterThanEqual(Instant dayStart);

    @EntityGraph(attributePaths = {"store", "createdBy", "outputProduct", "lines", "lines.product"})
    @Query("SELECT p FROM StockProduction p WHERE p.id = :id")
    Optional<StockProduction> findDetailedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"store", "createdBy", "outputProduct"})
    @Query("""
        SELECT p FROM StockProduction p
        WHERE p.store.company.id = :companyId
          AND p.createdAt >= :start AND p.createdAt < :end
          AND (:storeId IS NULL OR p.store.id = :storeId)
        ORDER BY p.createdAt DESC
        """)
    Page<StockProduction> findBetween(
        @Param("companyId") Integer companyId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
