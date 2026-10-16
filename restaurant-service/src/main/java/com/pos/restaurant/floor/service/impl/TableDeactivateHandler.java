package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class TableDeactivateHandler {

    private static final List<OrderStatus> OPEN_STATUSES = List.of(OrderStatus.OPEN, OrderStatus.BILLING);

    private final FloorEntityLookup entityLookup;
    private final FloorOrderRepository orderRepository;
    private final FloorOrderTableLinkRepository linkRepository;

    @Transactional
    public void handle(Integer tableId) {
        FloorTable table = entityLookup.requireTable(tableId);
        if (table.getStatus() == TableStatus.OCCUPIED || table.getStatus() == TableStatus.WAITING_PAYMENT) {
            throw new BusinessException("Cannot deactivate a table with an open check");
        }
        if (orderRepository.existsByTableIdAndStatusIn(tableId, OPEN_STATUSES)
            || linkRepository.existsByTableIdAndOrderStatusIn(tableId, OPEN_STATUSES)) {
            throw new BusinessException("Cannot deactivate a table with an open check");
        }
        table.setActive(false);
        LogUtil.info(TableDeactivateHandler.class, "Table deactivated: id={}", tableId);
    }
}
