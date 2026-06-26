package com.pos.reporting.repository;

import com.pos.reporting.entity.StockReceiptFact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface StockReceiptFactRepository extends JpaRepository<StockReceiptFact, UUID> {

    @Query("""
        SELECT f FROM StockReceiptFact f
        WHERE f.companyId = :companyId
          AND f.transactionDate >= :from
          AND f.transactionDate <= :to
          AND (:storeId IS NULL OR f.storeId = :storeId)
        ORDER BY COALESCE(f.createdAt, f.ingestedAt) DESC, f.receiptId DESC
        """)
    Page<StockReceiptFact> pageByFilters(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query(value = """
        SELECT COALESCE(SUM(COALESCE(f.total_quantity, 0)), 0),
               COALESCE(SUM(f.total_amount), 0)
        FROM stock_receipt_facts f
        WHERE f.company_id = :companyId
          AND f.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR f.store_id = :storeId)
        """, nativeQuery = true)
    Object[] sumReceivedTotals(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT CAST(f.transaction_date AS varchar),
               COALESCE(SUM(COALESCE(f.total_quantity, 0)), 0)
        FROM stock_receipt_facts f
        WHERE f.company_id = :companyId
          AND f.transaction_date BETWEEN :from AND :to
          AND (:storeId IS NULL OR f.store_id = :storeId)
        GROUP BY f.transaction_date
        ORDER BY f.transaction_date
        """, nativeQuery = true)
    List<Object[]> dailyReceivedUnits(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );
}
