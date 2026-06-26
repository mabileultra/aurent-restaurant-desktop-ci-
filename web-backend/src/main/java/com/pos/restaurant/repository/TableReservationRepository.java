package com.pos.restaurant.repository;

import com.pos.restaurant.domain.TableReservationStatus;
import com.pos.restaurant.entity.TableReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TableReservationRepository extends JpaRepository<TableReservation, UUID> {

    @Query("""
        SELECT r FROM TableReservation r
        JOIN FETCH r.table t
        JOIN FETCH t.hall
        JOIN FETCH r.store
        WHERE r.store.id = :storeId
          AND r.reservedAt BETWEEN :from AND :to
        ORDER BY r.reservedAt ASC
        """)
    List<TableReservation> findByStoreIdAndReservedAtBetweenOrderByReservedAtAsc(
        @Param("storeId") Integer storeId,
        @Param("from") Instant from,
        @Param("to") Instant to);

    @Query("""
        SELECT r FROM TableReservation r
        JOIN FETCH r.table t
        JOIN FETCH t.hall
        JOIN FETCH r.store
        WHERE r.store.id = :storeId
          AND r.status IN :statuses
        ORDER BY r.reservedAt ASC
        """)
    List<TableReservation> findByStoreIdAndStatusInOrderByReservedAtAsc(
        @Param("storeId") Integer storeId,
        @Param("statuses") List<TableReservationStatus> statuses);

    @Query("""
        SELECT r FROM TableReservation r
        JOIN FETCH r.table t
        JOIN FETCH t.hall
        JOIN FETCH r.store
        WHERE r.id = :id
        """)
    Optional<TableReservation> findByIdWithDetails(@Param("id") UUID id);

    Optional<TableReservation> findByTableIdAndStatusIn(
        Integer tableId, List<TableReservationStatus> statuses);

    boolean existsByTableIdAndStatusInAndIdNot(
        Integer tableId, List<TableReservationStatus> statuses, UUID excludeId);
}
