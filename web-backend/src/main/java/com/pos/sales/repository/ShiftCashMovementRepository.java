package com.pos.sales.repository;

import com.pos.sales.entity.ShiftCashMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShiftCashMovementRepository extends JpaRepository<ShiftCashMovement, UUID> {

    List<ShiftCashMovement> findByShift_IdOrderByCreatedAtAsc(UUID shiftId);
}
