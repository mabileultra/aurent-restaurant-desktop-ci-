package com.pos.restaurant.support;

import com.pos.restaurant.dto.TableReservationResponse;
import com.pos.restaurant.entity.TableReservation;
import org.springframework.stereotype.Component;

@Component
public class TableReservationMapper {

    public TableReservationResponse toResponse(TableReservation reservation) {
        return new TableReservationResponse(
            reservation.getId(),
            reservation.getStore().getId(),
            reservation.getTable().getId(),
            reservation.getTable().getCode(),
            reservation.getTable().getLabel(),
            reservation.getTable().getHall().getName(),
            reservation.getClientName(),
            reservation.getClientPhone(),
            reservation.getGuestCount(),
            reservation.getReservedAt(),
            reservation.getDurationMinutes(),
            reservation.getNotes(),
            reservation.getStatus().name(),
            reservation.getCreatedAt()
        );
    }
}
