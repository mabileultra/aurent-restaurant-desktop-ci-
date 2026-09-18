package com.pos.pharmacy.marks.repository;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockMarkRepository extends JpaRepository<StockMark, UUID> {

    List<StockMark> findByCompanyIdAndMarkKeyIn(Integer companyId, Collection<String> markKeys);

    Optional<StockMark> findFirstByCompanyIdAndMarkKeyInAndStatus(
        Integer companyId,
        Collection<String> markKeys,
        StockMarkStatus status
    );

    boolean existsByCompanyIdAndMarkKeyInAndStatusIn(
        Integer companyId,
        Collection<String> markKeys,
        Collection<StockMarkStatus> statuses
    );

    List<StockMark> findTop100ByStatusOrderByUpdatedAtAsc(StockMarkStatus status);

    @Query("""
        SELECT m FROM StockMark m
        WHERE m.companyId = :companyId
          AND (:storeId IS NULL OR m.storeId = :storeId)
          AND (:status IS NULL OR m.status = :status)
          AND (:soldFrom IS NULL OR COALESCE(m.soldAt, m.updatedAt) >= :soldFrom)
          AND (:soldTo IS NULL OR COALESCE(m.soldAt, m.updatedAt) < :soldTo)
          AND (
            :search IS NULL
            OR LOWER(m.markCode) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(m.markKey) LIKE LOWER(CONCAT('%', :search, '%'))
          )
          AND (
            :problemsOnly = false
            OR m.status = com.pos.pharmacy.marks.entity.StockMarkStatus.PENDING_WITHDRAW
            OR (m.lastWithdrawError IS NOT NULL AND LENGTH(TRIM(m.lastWithdrawError)) > 0)
          )
          AND (
            :shiftId IS NULL
            OR EXISTS (
              SELECT 1 FROM com.pos.pharmacy.sales.entity.Sale s
              WHERE s.id = m.saleId
                AND s.companyId = :companyId
                AND s.cashierShiftId = :shiftId
            )
          )
        ORDER BY COALESCE(m.soldAt, m.updatedAt) DESC
        """)
    Page<StockMark> searchForMonitor(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("status") StockMarkStatus status,
        @Param("shiftId") UUID shiftId,
        @Param("soldFrom") Instant soldFrom,
        @Param("soldTo") Instant soldTo,
        @Param("search") String search,
        @Param("problemsOnly") boolean problemsOnly,
        Pageable pageable
    );
}
