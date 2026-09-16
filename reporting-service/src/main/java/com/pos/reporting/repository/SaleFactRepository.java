package com.pos.reporting.repository;

import com.pos.reporting.entity.SaleFact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SaleFactRepository extends JpaRepository<SaleFact, UUID> {

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    BigDecimal sumTotalByCompanyAndDateRange(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT COALESCE(SUM(s.itemsSold), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    long sumItemsSoldByCompanyAndDateRange(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT COUNT(s)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    long countCompletedByCompanyAndTransactionDateBetween(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    default long countByCompanyIdAndTransactionDateBetween(Integer companyId, LocalDate from, LocalDate to) {
        return countCompletedByCompanyAndTransactionDateBetween(companyId, from, to);
    }

    @Query("""
        SELECT s.transactionDate, COALESCE(SUM(s.totalAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        GROUP BY s.transactionDate
        ORDER BY s.transactionDate
        """)
    List<Object[]> dailyRevenueByCompanyAndDateRange(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    BigDecimal sumTotalByCompanyDateRangeAndStore(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(s.itemsSold), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    long sumItemsSoldByCompanyDateRangeAndStore(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(s)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR s.storeId = :storeId)
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        """)
    long countByCompanyDateRangeAndStore(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query(value = """
        SELECT s.store_id,
               MAX(s.store_name),
               COUNT(*),
               COALESCE(SUM(s.items_sold), 0),
               COALESCE(SUM(s.total_amount), 0)
        FROM sale_facts s
        WHERE s.company_id = :companyId
          AND s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        GROUP BY s.store_id
        ORDER BY SUM(s.total_amount) DESC
        """,
        countQuery = """
        SELECT COUNT(DISTINCT s.store_id)
        FROM sale_facts s
        WHERE s.company_id = :companyId
          AND s.transaction_date BETWEEN :from AND :to
          AND s.sale_status IN ('COMPLETED', 'REFUNDED')
        """,
        nativeQuery = true)
    org.springframework.data.domain.Page<Object[]> storeSalesAggregate(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        org.springframework.data.domain.Pageable pageable
    );

    @Query("""
        SELECT COALESCE(MAX(s.cashierName), CAST(s.createdBy AS string)), COALESCE(SUM(s.totalAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.createdBy IS NOT NULL
          AND s.saleStatus IN ('COMPLETED', 'REFUNDED')
        GROUP BY s.createdBy
        ORDER BY SUM(s.totalAmount) DESC
        """)
    List<Object[]> cashierPerformance(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT COUNT(s), COALESCE(SUM(s.totalAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.saleStatus IN ('REFUNDED', 'VOIDED')
        """)
    Object[] aggregateReturns(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}
