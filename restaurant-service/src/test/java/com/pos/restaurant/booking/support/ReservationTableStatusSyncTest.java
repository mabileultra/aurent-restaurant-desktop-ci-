package com.pos.restaurant.booking.support;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReservationTableStatusSyncTest {

    private final ReservationTableStatusSync sync = new ReservationTableStatusSync();

    @Test
    void marksFreeAndCleaningAsReserved() {
        FloorTable free = FloorTable.builder().status(TableStatus.FREE).build();
        FloorTable cleaning = FloorTable.builder().status(TableStatus.CLEANING).build();
        FloorTable occupied = FloorTable.builder().status(TableStatus.OCCUPIED).build();

        sync.markReserved(free);
        sync.markReserved(cleaning);
        sync.markReserved(occupied);

        assertEquals(TableStatus.RESERVED, free.getStatus());
        assertEquals(TableStatus.RESERVED, cleaning.getStatus());
        assertEquals(TableStatus.OCCUPIED, occupied.getStatus());
    }

    @Test
    void releasesOnlyReserved() {
        FloorTable reserved = FloorTable.builder().status(TableStatus.RESERVED).build();
        FloorTable occupied = FloorTable.builder().status(TableStatus.OCCUPIED).build();

        sync.releaseIfReserved(reserved);
        sync.releaseIfReserved(occupied);

        assertEquals(TableStatus.FREE, reserved.getStatus());
        assertEquals(TableStatus.OCCUPIED, occupied.getStatus());
    }
}
