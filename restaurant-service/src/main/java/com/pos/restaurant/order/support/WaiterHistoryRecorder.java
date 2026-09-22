package com.pos.restaurant.order.support;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderWaiterHistory;
import com.pos.restaurant.order.repository.FloorOrderWaiterHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WaiterHistoryRecorder {

    private final FloorOrderWaiterHistoryRepository historyRepository;
    private final FloorTenantSupport tenantSupport;

    public void record(FloorOrder order, UUID waiterUserId) {
        if (order == null || waiterUserId == null) {
            return;
        }
        UUID assignedBy = null;
        try {
            assignedBy = tenantSupport.requireUserId();
        } catch (RuntimeException ignored) {
            // optional actor
        }
        historyRepository.save(FloorOrderWaiterHistory.builder()
            .order(order)
            .waiterUserId(waiterUserId)
            .assignedByUserId(assignedBy)
            .build());
    }
}
