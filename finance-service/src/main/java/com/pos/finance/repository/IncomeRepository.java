package com.pos.finance.repository;

import com.pos.finance.entity.Income;
import com.pos.finance.entity.IncomeSourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncomeRepository extends JpaRepository<Income, UUID> {

    Optional<Income> findByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, IncomeSourceType sourceType, String sourceId
    );

    boolean existsByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, IncomeSourceType sourceType, String sourceId
    );

    boolean existsByCompanyIdAndSourceTypeAndDeletedFalse(
        Integer companyId, IncomeSourceType sourceType
    );

    @Query("""
        SELECT i FROM Income i
        JOIN FETCH i.account
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
        """)
    List<Income> findUndeletedWithAccount(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType
    );

    List<Income> findAllByCompanyIdAndSourceTypeAndSourceIdAndDeletedFalse(
        Integer companyId, IncomeSourceType sourceType, String sourceId
    );

    @Query("""
        SELECT COUNT(i) > 0 FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = com.pos.finance.entity.IncomeSourceType.Z_REPORT
          AND i.sourceId LIKE CONCAT(:groupKey, '%')
        """)
    boolean existsZReportIncome(@Param("companyId") Integer companyId, @Param("groupKey") String groupKey);

    Optional<Income> findByIdAndCompanyIdAndDeletedFalse(UUID id, Integer companyId);

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND (:storeId IS NULL OR i.storeId = :storeId)
          AND i.transactionDate >= COALESCE(:from, i.transactionDate)
          AND i.transactionDate <= COALESCE(:to, i.transactionDate)
          AND i.paymentMethod = COALESCE(:paymentMethod, i.paymentMethod)
          AND (:excludeSale = false OR i.sourceType <> com.pos.finance.entity.IncomeSourceType.SALE)
          AND (:excludeZReport = false OR i.sourceType <> com.pos.finance.entity.IncomeSourceType.Z_REPORT)
          AND (:sourceType IS NULL OR i.sourceType = :sourceType)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    Page<Income> search(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("paymentMethod") com.pos.finance.entity.PaymentMethod paymentMethod,
        @Param("excludeSale") boolean excludeSale,
        @Param("excludeZReport") boolean excludeZReport,
        @Param("sourceType") IncomeSourceType sourceType,
        Pageable pageable
    );

    @Query("""
        SELECT i.transactionDate, i.storeId,
               COALESCE(SUM(i.amount), 0),
               COALESCE(SUM(CASE WHEN i.paymentMethod = com.pos.finance.entity.PaymentMethod.CASH THEN i.amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN i.paymentMethod = com.pos.finance.entity.PaymentMethod.CARD THEN i.amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN i.paymentMethod = com.pos.finance.entity.PaymentMethod.CASH AND i.sourceType = com.pos.finance.entity.IncomeSourceType.Z_REPORT THEN 1 ELSE 0 END), 0)
        FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType IN (com.pos.finance.entity.IncomeSourceType.Z_REPORT, com.pos.finance.entity.IncomeSourceType.SALE)
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        GROUP BY i.transactionDate, i.storeId
        ORDER BY i.transactionDate DESC
        """)
    List<Object[]> sumDailyRevenue(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT i.transactionDate, i.storeId,
               COALESCE(SUM(i.amount), 0),
               COALESCE(SUM(CASE WHEN i.paymentMethod = com.pos.finance.entity.PaymentMethod.CASH THEN i.amount ELSE 0 END), 0),
               COALESCE(SUM(CASE WHEN i.paymentMethod = com.pos.finance.entity.PaymentMethod.CARD THEN i.amount ELSE 0 END), 0),
               COUNT(DISTINCT i.sourceId)
        FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        GROUP BY i.transactionDate, i.storeId
        ORDER BY i.transactionDate DESC
        """)
    List<Object[]> sumDailyRevenueBySource(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(i.amount), 0) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    BigDecimal sumByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(i.amount), 0) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    BigDecimal sumBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(i) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    long countBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(DISTINCT i.sourceId) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = :sourceType
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
          AND i.sourceId IS NOT NULL
        """)
    long countDistinctSourceIdBySourceAndPeriod(
        @Param("companyId") Integer companyId,
        @Param("sourceType") IncomeSourceType sourceType,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COUNT(DISTINCT SUBSTRING(i.sourceId, 1, LOCATE(':', i.sourceId, 10) - 1)) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType = com.pos.finance.entity.IncomeSourceType.Z_REPORT
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
          AND i.sourceId LIKE 'z-report:%'
        """)
    long countDistinctZReportGroups(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT COALESCE(SUM(i.amount), 0) FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType <> :excludedSource
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        """)
    BigDecimal sumByPeriodExcludingSource(
        @Param("companyId") Integer companyId,
        @Param("excludedSource") IncomeSourceType excludedSource,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND (:storeId IS NULL OR i.storeId = :storeId)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    List<Income> findRecent(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT i FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        ORDER BY i.transactionDate DESC, i.createdAt DESC
        """)
    List<Income> findRecentInPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId,
        Pageable pageable
    );

    @Query("""
        SELECT i.transactionDate, COALESCE(SUM(i.amount), 0)
        FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        GROUP BY i.transactionDate
        ORDER BY i.transactionDate
        """)
    List<Object[]> sumDailyByPeriod(
        @Param("companyId") Integer companyId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );

    @Query("""
        SELECT i.transactionDate, COALESCE(SUM(i.amount), 0)
        FROM Income i
        WHERE i.companyId = :companyId AND i.deleted = false
          AND i.sourceType <> :excludedSource
          AND i.transactionDate BETWEEN :from AND :to
          AND (:storeId IS NULL OR i.storeId = :storeId)
        GROUP BY i.transactionDate
        ORDER BY i.transactionDate
        """)
    List<Object[]> sumDailyByPeriodExcludingSource(
        @Param("companyId") Integer companyId,
        @Param("excludedSource") IncomeSourceType excludedSource,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("storeId") Integer storeId
    );
}
