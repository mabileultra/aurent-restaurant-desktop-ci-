package com.pos.restaurant.order.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class TableOpenPolicy {

    private static final Set<TableStatus> OPENABLE = EnumSet.of(
        TableStatus.FREE,
        TableStatus.RESERVED,
        TableStatus.CLEANING
    );

    public void assertCanOpen(TableStatus status) {
        if (status == TableStatus.BLOCKED) {
            throw new BusinessException("Table is blocked");
        }
        if (status == TableStatus.OCCUPIED || status == TableStatus.WAITING_PAYMENT) {
            return;
        }
        if (!OPENABLE.contains(status)) {
            throw new BusinessException("Cannot open an order on table status " + status);
        }
    }
}
