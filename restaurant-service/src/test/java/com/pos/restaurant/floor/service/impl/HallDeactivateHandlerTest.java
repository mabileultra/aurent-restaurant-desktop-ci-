package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorEntityLookup;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.repository.FloorOrderTableLinkRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HallDeactivateHandlerTest {

    private static final List<OrderStatus> OPEN = List.of(OrderStatus.OPEN, OrderStatus.BILLING);

    @Mock
    private FloorTableRepository tableRepository;
    @Mock
    private FloorEntityLookup entityLookup;
    @Mock
    private FloorOrderRepository orderRepository;
    @Mock
    private FloorOrderTableLinkRepository linkRepository;

    @InjectMocks
    private HallDeactivateHandler handler;

    @Test
    void deactivatesHallWithoutActiveTablesOrOpenOrders() {
        FloorHall hall = FloorHall.builder().id(9).active(true).build();
        when(entityLookup.requireHall(9)).thenReturn(hall);
        when(tableRepository.existsByHallIdAndActiveTrue(9)).thenReturn(false);
        when(orderRepository.existsByHallIdAndStatusIn(9, OPEN)).thenReturn(false);
        when(linkRepository.existsByHallIdAndOrderStatusIn(9, OPEN)).thenReturn(false);

        handler.handle(9);

        assertFalse(hall.isActive());
        verify(orderRepository).existsByHallIdAndStatusIn(eq(9), eq(OPEN));
    }

    @Test
    void rejectsWhenActiveTablesRemain() {
        FloorHall hall = FloorHall.builder().id(9).active(true).build();
        when(entityLookup.requireHall(9)).thenReturn(hall);
        when(tableRepository.existsByHallIdAndActiveTrue(9)).thenReturn(true);

        assertThrows(BusinessException.class, () -> handler.handle(9));
        assertTrue(hall.isActive());
    }

    @Test
    void rejectsWhenOpenOrdersRemainOnHallTables() {
        FloorHall hall = FloorHall.builder().id(9).active(true).build();
        when(entityLookup.requireHall(9)).thenReturn(hall);
        when(tableRepository.existsByHallIdAndActiveTrue(9)).thenReturn(false);
        when(orderRepository.existsByHallIdAndStatusIn(9, OPEN)).thenReturn(true);

        assertThrows(BusinessException.class, () -> handler.handle(9));
        assertTrue(hall.isActive());
    }
}
