package com.pos.restaurant.booking.support;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import org.springframework.stereotype.Component;

@Component
public class ReservationTableStatusSync {

    public void markReserved(FloorTable table) {
        if (table.getStatus() == TableStatus.FREE || table.getStatus() == TableStatus.CLEANING) {
            table.setStatus(TableStatus.RESERVED);
        }
    }

    public void releaseIfReserved(FloorTable table) {
        if (table.getStatus() == TableStatus.RESERVED) {
            table.setStatus(TableStatus.FREE);
        }
    }
}
