package com.pos.restaurant.booking.service.impl;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.booking.support.ReservationResponseAssembler;
import com.pos.restaurant.booking.support.ReservationTableStatusSync;
import com.pos.restaurant.exception.BusinessException;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReservationCancelHandler {

    private final ReservationLookup reservationLookup;
    private final ReservationTableStatusSync tableStatusSync;
    private final ReservationResponseAssembler assembler;

    @Transactional
    public ReservationResponse handle(UUID reservationId) {
        FloorReservation reservation = reservationLookup.require(reservationId);
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            return assembler.toResponse(reservation);
        }
        if (reservation.getStatus() == ReservationStatus.SEATED) {
            throw new BusinessException("Cannot cancel seated reservation");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        tableStatusSync.releaseIfReserved(reservation.getTable());
        LogUtil.info(ReservationCancelHandler.class, "Reservation cancelled: {}", reservationId);
        return assembler.toResponse(reservation);
    }
}
