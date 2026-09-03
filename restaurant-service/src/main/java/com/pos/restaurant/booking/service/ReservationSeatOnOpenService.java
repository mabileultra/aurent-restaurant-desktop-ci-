package com.pos.restaurant.booking.service;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.repository.FloorReservationRepository;
import com.pos.restaurant.booking.support.ReservationLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationSeatOnOpenService {

    private final FloorReservationRepository reservationRepository;

    @Transactional
    public void markSeatedForTable(Integer tableId) {
        List<FloorReservation> active = reservationRepository.findByTableIdAndStatusIn(
            tableId,
            ReservationLookup.ACTIVE_STATUSES
        );
        for (FloorReservation reservation : active) {
            reservation.setStatus(ReservationStatus.SEATED);
        }
    }
}
