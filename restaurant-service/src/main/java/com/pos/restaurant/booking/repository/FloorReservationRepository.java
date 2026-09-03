package com.pos.restaurant.booking.repository;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.entity.FloorReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FloorReservationRepository extends JpaRepository<FloorReservation, UUID> {

    @Query("""
        select r from FloorReservation r
        join fetch r.table t
        join fetch t.hall
        where r.companyId = :companyId and r.storeId = :storeId
          and r.reservedAt between :from and :to
        order by r.reservedAt asc
        """)
    List<FloorReservation> findByStoreAndRange(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        select r from FloorReservation r
        join fetch r.table t
        join fetch t.hall
        where r.companyId = :companyId and r.storeId = :storeId
          and r.status in :statuses
        order by r.reservedAt asc
        """)
    List<FloorReservation> findByStoreAndStatuses(
        @Param("companyId") Integer companyId,
        @Param("storeId") Integer storeId,
        @Param("statuses") Collection<ReservationStatus> statuses
    );

    @Query("""
        select r from FloorReservation r
        join fetch r.table t
        join fetch t.hall
        where r.id = :id and r.companyId = :companyId
        """)
    Optional<FloorReservation> findByIdAndCompanyId(
        @Param("id") UUID id,
        @Param("companyId") Integer companyId
    );

    boolean existsByTableIdAndStatusIn(Integer tableId, Collection<ReservationStatus> statuses);

    boolean existsByTableIdAndStatusInAndIdNot(
        Integer tableId,
        Collection<ReservationStatus> statuses,
        UUID excludeId
    );

    @Query("""
        select r from FloorReservation r
        join fetch r.table t
        where t.id = :tableId and r.status in :statuses
        order by r.reservedAt asc
        """)
    List<FloorReservation> findByTableIdAndStatusIn(
        @Param("tableId") Integer tableId,
        @Param("statuses") Collection<ReservationStatus> statuses
    );
}
