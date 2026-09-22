package com.pos.inventory.repository;

import com.pos.inventory.entity.StockExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface StockExpenseRepository extends JpaRepository<StockExpense, UUID> {

    long countByCreatedAtGreaterThanEqual(Instant dayStart);

    @EntityGraph(attributePaths = {"store", "createdBy", "lines", "lines.product"})
    @Query("SELECT e FROM StockExpense e WHERE e.id = :id")
    Optional<StockExpense> findDetailedById(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"store", "createdBy"})
    @Query("""
        SELECT e FROM StockExpense e
        WHERE e.store.company.id = :companyId
          AND e.createdAt >= :start AND e.createdAt < :end
          AND (:storeId IS NULL OR e.store.id = :storeId)
        ORDER BY e.createdAt DESC
        """)
    Page<StockExpense> findBetween(
        @Param("companyId") Integer companyId,
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
