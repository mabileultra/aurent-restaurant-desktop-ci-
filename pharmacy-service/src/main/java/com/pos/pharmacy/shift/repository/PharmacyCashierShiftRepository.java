package com.pos.pharmacy.shift.repository;

import com.pos.pharmacy.shift.domain.PharmacyShiftStatus;
import com.pos.pharmacy.shift.entity.PharmacyCashierShift;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PharmacyCashierShiftRepository extends JpaRepository<PharmacyCashierShift, UUID> {

    Optional<PharmacyCashierShift> findByCashierIdAndStoreIdAndStatus(
        UUID cashierId,
        Integer storeId,
        PharmacyShiftStatus status
    );

    boolean existsByCashierIdAndStoreIdAndStatus(
        UUID cashierId,
        Integer storeId,
        PharmacyShiftStatus status
    );
}
