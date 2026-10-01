package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TableOpenPolicyTest {

    private final TableOpenPolicy policy = new TableOpenPolicy();

    @Test
    void allowsFreeReservedCleaning() {
        assertDoesNotThrow(() -> policy.assertCanOpen(TableStatus.FREE));
        assertDoesNotThrow(() -> policy.assertCanOpen(TableStatus.RESERVED));
        assertDoesNotThrow(() -> policy.assertCanOpen(TableStatus.CLEANING));
    }

    @Test
    void allowsAnotherCheckOnBusyTable() {
        assertDoesNotThrow(() -> policy.assertCanOpen(TableStatus.OCCUPIED));
        assertDoesNotThrow(() -> policy.assertCanOpen(TableStatus.WAITING_PAYMENT));
    }

    @Test
    void rejectsBlocked() {
        assertThrows(BusinessException.class, () -> policy.assertCanOpen(TableStatus.BLOCKED));
    }
}
