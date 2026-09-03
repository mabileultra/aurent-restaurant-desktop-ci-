package com.pos.restaurant.booking.support;

import com.pos.restaurant.booking.dto.ReservationResponse;
import com.pos.restaurant.booking.entity.FloorReservation;
import com.pos.restaurant.floor.entity.FloorTable;
import org.springframework.stereotype.Component;

@Component
public class ReservationResponseAssembler {

    public ReservationResponse toResponse(FloorReservation reservation) {
        FloorTable table = reservation.getTable();
        return new ReservationResponse(
            reservation.getId(),
            reservation.getStoreId(),
            table.getId(),
            table.getCode(),
            table.getLabel(),
            table.getHall().getName(),
            reservation.getClientName(),
            reservation.getClientPhone(),
            reservation.getGuestCount(),
            reservation.getReservedAt(),
            reservation.getDurationMinutes(),
            reservation.getNotes(),
            reservation.getStatus(),
            reservation.getCreatedAt()
        );
    }
}
