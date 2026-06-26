package com.pos.reporting.repository;

import com.pos.reporting.entity.StockMovementFact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface StockMovementFactRepository extends JpaRepository<StockMovementFact, UUID> {

    @Query("""
        SELECT f FROM StockMovementFact f
        WHERE f.companyId = :companyId
          AND f.transactionDate >= :from
          AND f.transactionDate <= :to
          AND (:movementType IS NULL OR f.movementType = :movementType)
          AND (:storeId IS NULL OR f.storeId = :storeId)
          AND (
            :search IS NULL
            OR LOWER(f.productName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(f.sku, '')) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(f.barcode, '')) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY COALESCE(f.createdAt, f.ingestedAt) DESC, f.movementId DESC
        """)
    Page<StockMovementFact> pageMovementJournal(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("movementType") String movementType,
        @Param("storeId") Integer storeId,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("""
        SELECT f FROM StockMovementFact f
        WHERE f.companyId = :companyId
          AND f.movementType = 'WRITE_OFF'
          AND f.transactionDate >= :from
          AND f.transactionDate <= :to
          AND (:storeId IS NULL OR f.storeId = :storeId)
        ORDER BY COALESCE(f.createdAt, f.ingestedAt) DESC, f.movementId DESC
        """)
    Page<StockMovementFact> pageWriteOffs(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );
}
