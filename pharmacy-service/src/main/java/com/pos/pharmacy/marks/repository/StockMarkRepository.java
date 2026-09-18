package com.pos.pharmacy.marks.repository;

import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.support.StockMarkMonitorSql;
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

    @Query(value = StockMarkMonitorSql.SELECT, countQuery = StockMarkMonitorSql.COUNT, nativeQuery = true)
    Page<StockMark> searchForMonitor(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("status") String status,
        @Param("shiftId") UUID shiftId,
        @Param("soldFrom") Instant soldFrom,
        @Param("soldTo") Instant soldTo,
        @Param("search") String search,
        @Param("problemsOnly") boolean problemsOnly,
        Pageable pageable
    );
}
