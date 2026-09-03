package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReservationLookup {

    public static final List<ReservationStatus> ACTIVE_STATUSES = List.of(
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED
    );

    private final FloorReservationRepository reservationRepository;
    private final FloorTenantSupport tenantSupport;

    public FloorReservation require(UUID reservationId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return reservationRepository.findByIdAndCompanyId(reservationId, companyId)
            .orElseThrow(() -> new NotFoundException("Reservation not found: " + reservationId));
    }
}
