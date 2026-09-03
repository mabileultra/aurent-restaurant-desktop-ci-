package com.pos.restaurant.booking.service.impl;

import com.pos.restaurant.booking.domain.ReservationStatus;
import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.dto.SaveReservationRequest;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.booking.support.ReservationLookup;
import com.pos.restaurant.booking.support.ReservationResponseAssembler;
import com.pos.restaurant.booking.support.ReservationTablePolicy;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ReservationUpdateHandler {

    private final ReservationLookup reservationLookup;
    private final FloorEntityLookup entityLookup;
    private final ReservationTablePolicy tablePolicy;
    private final ReservationResponseAssembler assembler;

    @Transactional
    public ReservationResponse handle(UUID reservationId, SaveReservationRequest request) {
        FloorReservation reservation = reservationLookup.require(reservationId);
        if (reservation.getStatus() == ReservationStatus.SEATED
            || reservation.getStatus() == ReservationStatus.CANCELLED
            || reservation.getStatus() == ReservationStatus.NO_SHOW) {
            throw new BusinessException("Cannot update reservation in status " + reservation.getStatus());
        }
        FloorTable table = entityLookup.requireTable(request.tableId());
        tablePolicy.assertActive(table);
        tablePolicy.assertBelongsToStore(table, reservation.getStoreId());
        if (!table.getId().equals(reservation.getTable().getId())) {
            tablePolicy.assertAvailable(table.getId(), reservationId);
        }
        reservation.setTable(table);
        reservation.setClientName(request.clientName().trim());
        reservation.setClientPhone(trimOrNull(request.clientPhone()));
        reservation.setGuestCount(request.guestCount());
        reservation.setReservedAt(request.reservedAt());
        if (request.durationMinutes() != null) {
            reservation.setDurationMinutes(request.durationMinutes());
        }
        reservation.setNotes(trimOrNull(request.notes()));
        return assembler.toResponse(reservation);
    }

    private static String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
