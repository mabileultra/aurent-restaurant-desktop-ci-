package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TableTransferTargetPolicyTest {

    private static final EnumSet<TableStatus> TARGET_OK = EnumSet.of(
        TableStatus.FREE,
        TableStatus.CLEANING
    );

    @Test
    void freeAndCleaningAreAllowed() {
        assertDoesNotThrow(() -> assertOk(TableStatus.FREE));
        assertDoesNotThrow(() -> assertOk(TableStatus.CLEANING));
    }

    @Test
    void occupiedIsRejected() {
        assertThrows(BusinessException.class, () -> assertOk(TableStatus.OCCUPIED));
        assertThrows(BusinessException.class, () -> assertOk(TableStatus.WAITING_PAYMENT));
        assertThrows(BusinessException.class, () -> assertOk(TableStatus.RESERVED));
        assertThrows(BusinessException.class, () -> assertOk(TableStatus.BLOCKED));
    }

    private void assertOk(TableStatus status) {
        if (!TARGET_OK.contains(status)) {
            throw new BusinessException("Target table is not free");
        }
    }
}
