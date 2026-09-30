package com.pos.restaurant.kitchen.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.kitchen.repository.KitchenStationRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketLineRepository;
import com.pos.restaurant.kitchen.repository.KitchenTicketRepository;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.print.service.PrintJobPublisher;
import com.pos.restaurant.print.support.PrintJobPayloads;
import com.pos.restaurant.settings.service.KitchenBoardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SendToKitchenHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private KitchenTicketRepository ticketRepository;
    @Mock private KitchenTicketLineRepository ticketLineRepository;
    @Mock private KitchenStationRepository stationRepository;
    @Mock private OrderLookup orderLookup;
    @Mock private OrderResponseAssembler assembler;
    @Mock private KitchenBoardService kitchenBoardService;
    @Mock private PrintJobPublisher printJobPublisher;

    @InjectMocks
    private SendToKitchenHandler handler;

    @Test
    void sendsNewLineFullyAndMarksSent() {
        UUID orderId = UUID.randomUUID();
        FloorOrder order = order(orderId);
        FloorOrderItem item = item(order, "1", "0", OrderItemStatus.NEW);
        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(item));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());

        handler.handle(orderId);

        assertEquals(OrderItemStatus.SENT_TO_KITCHEN, item.getItemStatus());
        assertEquals(0, item.getSentQuantity().compareTo(BigDecimal.ONE));
        verify(printJobPublisher).categorySlipsForPending(eq(order), any(), any());
        verify(ticketRepository, never()).save(any());
    }

    @Test
    void reorderSendsOnlyDeltaAndKeepsKitchenStatus() {
        UUID orderId = UUID.randomUUID();
        FloorOrder order = order(orderId);
        FloorOrderItem item = item(order, "3", "2", OrderItemStatus.READY);
        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(true);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(item));
        when(ticketRepository.save(any(KitchenTicket.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ticketLineRepository.save(any(KitchenTicketLine.class))).thenAnswer(inv -> inv.getArgument(0));
        when(assembler.toResponse(eq(order), any())).thenReturn(dummyResponse());

        handler.handle(orderId);

        assertEquals(OrderItemStatus.READY, item.getItemStatus());
        assertEquals(0, item.getSentQuantity().compareTo(new BigDecimal("3")));

        ArgumentCaptor<KitchenTicketLine> lineCap = ArgumentCaptor.forClass(KitchenTicketLine.class);
        verify(ticketLineRepository).save(lineCap.capture());
        assertEquals(0, lineCap.getValue().getQuantity().compareTo(BigDecimal.ONE));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PrintJobPayloads.KitchenSendLine>> sendCap = ArgumentCaptor.forClass(List.class);
        verify(printJobPublisher).kitchenSend(eq(order), sendCap.capture());
        assertEquals(1, sendCap.getValue().size());
        assertEquals(0, sendCap.getValue().get(0).quantity().compareTo(BigDecimal.ONE));
        assertEquals(item.getId(), sendCap.getValue().get(0).itemId());
    }

    @Test
    void fullySentThrows() {
        UUID orderId = UUID.randomUUID();
        FloorOrder order = order(orderId);
        FloorOrderItem item = item(order, "2", "2", OrderItemStatus.SENT_TO_KITCHEN);
        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(item));

        assertThrows(BusinessException.class, () -> handler.handle(orderId));
        verify(printJobPublisher, never()).categorySlipsForPending(any(), any(), any());
        verify(printJobPublisher, never()).kitchenSend(any(), any());
    }

    @Test
    void skipsCancelledEvenIfQtyLooksPending() {
        UUID orderId = UUID.randomUUID();
        FloorOrder order = order(orderId);
        FloorOrderItem cancelled = item(order, "5", "0", OrderItemStatus.CANCELLED);
        when(orderLookup.requireActive(orderId)).thenReturn(order);
        when(kitchenBoardService.isEnabled(1, 2)).thenReturn(false);
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId))
            .thenReturn(List.of(cancelled));

        assertThrows(BusinessException.class, () -> handler.handle(orderId));
    }

    private static FloorOrder order(UUID id) {
        return FloorOrder.builder()
            .id(id)
            .companyId(1)
            .storeId(2)
            .orderNo(100)
            .status(OrderStatus.OPEN)
            .build();
    }

    private static FloorOrderItem item(FloorOrder order, String qty, String sent, OrderItemStatus status) {
        return FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .name("Dish")
            .quantity(new BigDecimal(qty))
            .sentQuantity(new BigDecimal(sent))
            .itemStatus(status)
            .unitPrice(new BigDecimal("10.00"))
            .build();
    }

    private static OrderResponse dummyResponse() {
        return new OrderResponse(
            UUID.randomUUID(), 1, null, null, null, 2, OrderStatus.OPEN, null,
            1, 1, 0, null, null, null, null, null, null, null, null, null,
            BigDecimal.ZERO, null, null, null, BigDecimal.ZERO, null, null, 0,
            List.of(), List.of(), List.of()
        );
    }
}
