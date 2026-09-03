package com.pos.restaurant.floor.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class TableStatusPolicy {

    private static final Set<TableStatus> MANUAL_STATUSES = EnumSet.of(
        TableStatus.FREE,
        TableStatus.RESERVED,
        TableStatus.CLEANING,
        TableStatus.BLOCKED
    );

    public TableStatus statusForCreate(TableStatus requested) {
        if (requested == null || requested == TableStatus.FREE) {
            return TableStatus.FREE;
        }
        return requireManual(requested);
    }

    public TableStatus statusForUpdate(TableStatus requested, TableStatus current) {
        if (requested == null) {
            return current;
        }
        return requireManual(requested);
    }

    private TableStatus requireManual(TableStatus requested) {
        if (!MANUAL_STATUSES.contains(requested)) {
            throw new BusinessException("Table status " + requested + " is set by orders, not manually");
        }
        return requested;
    }
}
