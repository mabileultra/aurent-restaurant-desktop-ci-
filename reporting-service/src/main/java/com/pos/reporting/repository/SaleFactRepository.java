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
        SELECT i.store_id,
               COALESCE(MAX(s.store_name), CONCAT('Store #', i.store_id)),
               COUNT(DISTINCT i.sale_id),
               COALESCE(SUM(i.quantity - i.quantity_returned), 0),
               COALESCE(SUM(i.quantity_returned), 0),
               COALESCE(SUM(i.revenue), 0),
               COALESCE(SUM(i.cost_estimate), 0)
        FROM sale_item_facts i
        LEFT JOIN sale_facts s ON s.id = i.sale_id
        WHERE i.company_id = :companyId
          AND i.transaction_date BETWEEN :from AND :to
        GROUP BY i.store_id
        HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
            OR COALESCE(SUM(i.quantity_returned), 0) > 0
            OR COALESCE(SUM(i.revenue), 0) > 0
        ORDER BY SUM(i.revenue) DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM (
          SELECT i.store_id
          FROM sale_item_facts i
          WHERE i.company_id = :companyId
            AND i.transaction_date BETWEEN :from AND :to
          GROUP BY i.store_id
          HAVING COALESCE(SUM(i.quantity - i.quantity_returned), 0) > 0
              OR COALESCE(SUM(i.quantity_returned), 0) > 0
              OR COALESCE(SUM(i.revenue), 0) > 0
        ) sub
        """,
        nativeQuery = true)
    org.springframework.data.domain.Page<Object[]> storeSalesAggregate(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        org.springframework.data.domain.Pageable pageable
    );

    @Query("""
        SELECT s.createdBy,
               COALESCE(MAX(s.cashierName), CAST(s.createdBy AS string)),
               COUNT(s),
               COALESCE(SUM(s.totalAmount), 0)
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
        SELECT COUNT(s), COALESCE(SUM(s.returnedAmount), 0)
        FROM SaleFact s
        WHERE s.companyId = :companyId
          AND s.transactionDate BETWEEN :from AND :to
          AND s.returnedAmount > 0
        """)
    Object[] aggregateReturns(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}
