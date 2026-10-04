package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.TableSeatSync;
import com.pos.restaurant.print.service.PrintJobPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCancelHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private KitchenTicketRepository ticketRepository;
    @Mock private KitchenTicketLineRepository ticketLineRepository;
    @Mock private OrderLookup orderLookup;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private OrderLinkedTablesSupport linkedTables;
    @Mock private TableSeatSync tableSeatSync;
    @Mock private PrintJobPublisher printJobPublisher;

    @InjectMocks
    private OrderCancelHandler handler;

    @Test
    void cancel_printsCashierOrderCancelNotKitchenVoids() {
        UUID orderId = UUID.randomUUID();
        FloorOrder order = FloorOrder.builder().id(orderId).companyId(1).storeId(2).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .name("Steak")
            .quantity(BigDecimal.ONE)
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();

        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(tenantSupport.canCancelOrdersWithItems()).thenReturn(true);
        when(linkedTables.allTables(order)).thenReturn(List.of());
        when(ticketRepository.findByOrderId(orderId)).thenReturn(List.of());

        handler.handle(orderId);

        verify(printJobPublisher).orderCancelSlip(eq(order), eq(List.of(item)));
        verify(printJobPublisher, never()).voidSlipsForItems(any(), any());
        verify(printJobPublisher, never()).voidSlipsForItems(any(), any(), any());
        org.junit.jupiter.api.Assertions.assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }
}
