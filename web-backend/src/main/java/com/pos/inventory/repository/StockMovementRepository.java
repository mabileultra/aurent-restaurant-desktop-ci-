package com.pos.inventory.repository;

import com.pos.inventory.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    long countByStore_Id(Integer storeId);

    boolean existsByReferenceId(UUID referenceId);

    @Query("""
        SELECT m FROM StockMovement m
        JOIN FETCH m.product
        JOIN FETCH m.store st
        JOIN FETCH st.company
        LEFT JOIN FETCH m.createdBy
        WHERE m.createdAt >= :start AND m.createdAt < :end
          AND (:companyId IS NULL OR st.company.id = :companyId)
        ORDER BY m.createdAt ASC
        """)
    Page<StockMovement> findForReportingBackfill(
        @Param("start") Instant start,
        @Param("end") Instant end,
        @Param("companyId") Integer companyId,
        Pageable pageable
    );
}
