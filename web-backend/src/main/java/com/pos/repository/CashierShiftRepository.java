package com.pos.repository;

import com.pos.entity.CashierShift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CashierShiftRepository extends JpaRepository<CashierShift, UUID> {

    long countByStore_Id(Integer storeId);

    boolean existsByCashier_Id(UUID cashierId);

    Optional<CashierShift> findByCashierIdAndStoreIdAndStatus(
        UUID cashierId,
        Integer storeId,
        CashierShift.ShiftStatus status
    );

    @EntityGraph(attributePaths = {"store", "store.company", "cashier"})
    @Query("SELECT s FROM CashierShift s WHERE s.status = :status AND s.zReport IS NULL")
    List<CashierShift> findClosedWithoutZReport(@Param("status") CashierShift.ShiftStatus status);

    @EntityGraph(attributePaths = {"store", "store.company", "cashier"})
    @Query("""
        SELECT s FROM CashierShift s
        JOIN s.store st
        WHERE s.status = :status AND s.zReport IS NULL AND st.company.id = :companyId
        """)
    List<CashierShift> findClosedWithoutZReportByCompany(
        @Param("status") CashierShift.ShiftStatus status,
        @Param("companyId") Integer companyId
    );

    @EntityGraph(attributePaths = {"store", "store.company", "zReport"})
    @Query("""
        SELECT s FROM CashierShift s
        JOIN s.zReport z
        JOIN s.store st
        WHERE z.closedAt >= :from AND z.closedAt < :to
          AND (:companyId IS NULL OR st.company.id = :companyId)
        ORDER BY z.closedAt ASC
        """)
    Page<CashierShift> findClosedShiftsForReportingBackfill(
        @Param("from") java.time.Instant from,
        @Param("to") java.time.Instant to,
        @Param("companyId") Integer companyId,
        Pageable pageable
    );
}
