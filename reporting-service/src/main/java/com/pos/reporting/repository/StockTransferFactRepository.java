package com.pos.reporting.repository;

import com.pos.reporting.entity.StockTransferFact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface StockTransferFactRepository extends JpaRepository<StockTransferFact, UUID> {

    @Query("""
        SELECT f FROM StockTransferFact f
        WHERE f.companyId = :companyId
          AND f.transactionDate >= :from
          AND f.transactionDate <= :to
          AND (:fromStoreId IS NULL OR f.fromStoreId = :fromStoreId)
          AND (:toStoreId IS NULL OR f.toStoreId = :toStoreId)
        ORDER BY COALESCE(f.createdAt, f.ingestedAt) DESC, f.transferId DESC
        """)
    Page<StockTransferFact> pageTransfers(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("fromStoreId") Integer fromStoreId,
        @Param("toStoreId") Integer toStoreId,
        Pageable pageable
    );
}
