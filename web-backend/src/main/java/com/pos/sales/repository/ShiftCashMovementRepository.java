package com.pos.sales.repository;

import com.pos.sales.entity.ShiftCashMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ShiftCashMovementRepository extends JpaRepository<ShiftCashMovement, UUID> {

    List<ShiftCashMovement> findByShift_IdOrderByCreatedAtAsc(UUID shiftId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE WHEN m.direction = com.pos.sales.entity.ShiftCashMovement.Direction.IN
                 THEN m.amount ELSE -m.amount END
        ), 0)
        FROM ShiftCashMovement m
        WHERE m.shift.id = :shiftId
        """)
    BigDecimal sumNetAmountByShiftId(@Param("shiftId") UUID shiftId);
}
