package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.repository.FloorTableRepository;
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
public class HallDeactivateHandler {

    private static final List<OrderStatus> OPEN_STATUSES = List.of(OrderStatus.OPEN, OrderStatus.BILLING);

    private final FloorTableRepository tableRepository;
    private final FloorEntityLookup entityLookup;
    private final FloorOrderRepository orderRepository;
    private final FloorOrderTableLinkRepository linkRepository;

    @Transactional
    public void handle(Integer hallId) {
        FloorHall hall = entityLookup.requireHall(hallId);
        if (tableRepository.existsByHallIdAndActiveTrue(hallId)) {
            throw new BusinessException("Deactivate tables before deactivating the hall");
        }
        if (orderRepository.existsByHallIdAndStatusIn(hallId, OPEN_STATUSES)
            || linkRepository.existsByHallIdAndOrderStatusIn(hallId, OPEN_STATUSES)) {
            throw new BusinessException("Cannot deactivate a hall with open orders");
        }
        hall.setActive(false);
        LogUtil.info(HallDeactivateHandler.class, "Hall deactivated: id={}", hallId);
    }
}
