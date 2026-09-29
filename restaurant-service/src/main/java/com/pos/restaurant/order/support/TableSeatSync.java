package com.pos.restaurant.order.support;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;

/** Table color follows every open check on that table, not only the latest one. */
@Component
@RequiredArgsConstructor
public class TableSeatSync {

    private final FloorOrderRepository orderRepository;
    private final FloorOrderTableLinkRepository linkRepository;

    public void refresh(Collection<FloorTable> tables, TableStatus whenEmpty) {
        if (tables == null) {
            return;
        }
        for (FloorTable table : tables) {
            if (table == null || table.getId() == null) {
                continue;
            }
            boolean open = hasStatus(table.getId(), OrderStatus.OPEN);
            boolean billing = hasStatus(table.getId(), OrderStatus.BILLING);
            if (open) {
                table.setStatus(TableStatus.OCCUPIED);
            } else if (billing) {
                table.setStatus(TableStatus.WAITING_PAYMENT);
            } else {
                table.setStatus(whenEmpty);
            }
        }
    }

    private boolean hasStatus(Integer tableId, OrderStatus status) {
        if (orderRepository.existsByTableIdAndStatusIn(tableId, List.of(status))) {
            return true;
        }
        return linkRepository.findByTableId(tableId)
            .map(link -> link.getOrder() != null && link.getOrder().getStatus() == status)
            .orElse(false);
    }
}
