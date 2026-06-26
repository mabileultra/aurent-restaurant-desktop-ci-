package com.pos.reporting.repository;

import com.pos.reporting.entity.StockInventoryFact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface StockInventoryFactRepository extends JpaRepository<StockInventoryFact, UUID> {

    @Query("""
        SELECT f FROM StockInventoryFact f
        WHERE f.companyId = :companyId
          AND f.transactionDate >= :from
          AND f.transactionDate <= :to
          AND (:storeId IS NULL OR f.storeId = :storeId)
        ORDER BY COALESCE(f.createdAt, f.ingestedAt) DESC, f.inventoryId DESC
        """)
    Page<StockInventoryFact> pageInventories(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
