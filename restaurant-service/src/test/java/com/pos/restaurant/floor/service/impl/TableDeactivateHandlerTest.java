package com.pos.restaurant.floor.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TableDeactivateHandlerTest {

    private static final List<OrderStatus> OPEN = List.of(OrderStatus.OPEN, OrderStatus.BILLING);

    @Mock
    private FloorEntityLookup entityLookup;
    @Mock
    private FloorOrderRepository orderRepository;
    @Mock
    private FloorOrderTableLinkRepository linkRepository;

    @InjectMocks
    private TableDeactivateHandler handler;

    @Test
    void deactivatesFreeTableWithoutOpenOrders() {
        FloorTable table = FloorTable.builder().id(5).status(TableStatus.FREE).active(true).build();
        when(entityLookup.requireTable(5)).thenReturn(table);
        when(orderRepository.existsByTableIdAndStatusIn(5, OPEN)).thenReturn(false);
        when(linkRepository.existsByTableIdAndOrderStatusIn(5, OPEN)).thenReturn(false);

        handler.handle(5);

        assertFalse(table.isActive());
        verify(orderRepository).existsByTableIdAndStatusIn(eq(5), eq(OPEN));
    }

    @Test
    void rejectsWhenTableStatusOccupied() {
        FloorTable table = FloorTable.builder().id(5).status(TableStatus.OCCUPIED).active(true).build();
        when(entityLookup.requireTable(5)).thenReturn(table);

        assertThrows(BusinessException.class, () -> handler.handle(5));
        assertTrue(table.isActive());
        verify(orderRepository, never()).existsByTableIdAndStatusIn(eq(5), eq(OPEN));
    }

    @Test
    void rejectsWhenOpenOrderExistsEvenIfTableLooksFree() {
        FloorTable table = FloorTable.builder().id(5).status(TableStatus.FREE).active(true).build();
        when(entityLookup.requireTable(5)).thenReturn(table);
        when(orderRepository.existsByTableIdAndStatusIn(5, OPEN)).thenReturn(true);

        assertThrows(BusinessException.class, () -> handler.handle(5));
        assertTrue(table.isActive());
    }
}
