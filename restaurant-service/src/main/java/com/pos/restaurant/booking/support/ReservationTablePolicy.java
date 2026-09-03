package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.floor.entity.FloorTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReservationTablePolicy {

    private final FloorReservationRepository reservationRepository;

    public void assertActive(FloorTable table) {
        if (!table.isActive()) {
            throw new ValidationException("Table is inactive");
        }
    }

    public void assertBelongsToStore(FloorTable table, Integer storeId) {
        if (!table.getStoreId().equals(storeId)) {
            throw new BusinessException("Table does not belong to store");
        }
    }

    public void assertAvailable(Integer tableId, UUID excludeReservationId) {
        boolean busy = excludeReservationId == null
            ? reservationRepository.existsByTableIdAndStatusIn(tableId, ReservationLookup.ACTIVE_STATUSES)
            : reservationRepository.existsByTableIdAndStatusInAndIdNot(
                tableId, ReservationLookup.ACTIVE_STATUSES, excludeReservationId
            );
        if (busy) {
            throw new BusinessException("Table already has an active reservation");
        }
    }
}
