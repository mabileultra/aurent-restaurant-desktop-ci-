package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TableStatusPolicyTest {

    private final TableStatusPolicy policy = new TableStatusPolicy();

    @Test
    void createDefaultsToFree() {
        assertEquals(TableStatus.FREE, policy.statusForCreate(null));
        assertEquals(TableStatus.FREE, policy.statusForCreate(TableStatus.FREE));
    }

    @Test
    void createAllowsManualStatuses() {
        assertEquals(TableStatus.BLOCKED, policy.statusForCreate(TableStatus.BLOCKED));
        assertEquals(TableStatus.RESERVED, policy.statusForCreate(TableStatus.RESERVED));
    }

    @Test
    void createRejectsOrderDrivenStatuses() {
        assertThrows(BusinessException.class, () -> policy.statusForCreate(TableStatus.OCCUPIED));
        assertThrows(BusinessException.class, () -> policy.statusForCreate(TableStatus.WAITING_PAYMENT));
    }

    @Test
    void updateKeepsCurrentWhenNull() {
        assertEquals(TableStatus.CLEANING, policy.statusForUpdate(null, TableStatus.CLEANING));
    }
}
