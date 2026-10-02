package com.pos.restaurant.localfirst.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.repository.FloorTableRepository;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.menu.repository.MenuItemRepository;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.payment.service.impl.PayOrderHandler;
import com.pos.restaurant.shift.support.ShiftLookup;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalEventApplicatorTest {

    @Mock private FloorOrderRepository orderRepository;
    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private FloorTableRepository tableRepository;
    @Mock private MenuItemRepository menuItemRepository;
    @Mock private ShiftLookup shiftLookup;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private PayOrderHandler payOrderHandler;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private LocalEventApplicator applicator;

    @BeforeEach
    void setUp() {
        applicator = new LocalEventApplicator(
            orderRepository,
            itemRepository,
            tableRepository,
            menuItemRepository,
            shiftLookup,
            tenantSupport,
            payOrderHandler,
            objectMapper
        );
    }

    @Test
    void orderOpenCreatesOrderWithClientIdAndOccupiesTable() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        FloorTable table = FloorTable.builder().id(5).companyId(10).storeId(1).status(TableStatus.FREE).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        when(tableRepository.findByIdAndCompanyId(5, 10)).thenReturn(Optional.of(table));
        when(shiftLookup.findOpen(1)).thenReturn(Optional.empty());
        when(tenantSupport.requireUserId()).thenReturn(userId);
        when(orderRepository.findMaxOrderNo(1)).thenReturn(41);
        when(orderRepository.save(any(FloorOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("tableId", "5")
            .put("guestCount", 3)
            .put("adultCount", 2)
            .put("childrenCount", 1);

        applicator.apply(10, 1, "ORDER_OPEN", payload.toString());

        ArgumentCaptor<FloorOrder> cap = ArgumentCaptor.forClass(FloorOrder.class);
        verify(orderRepository).save(cap.capture());
        FloorOrder saved = cap.getValue();
        assertEquals(orderId, saved.getId());
        assertEquals(42, saved.getOrderNo());
        assertEquals(OrderStatus.OPEN, saved.getStatus());
        assertEquals(3, saved.getGuestCount());
        assertSame(table, saved.getTable());
        assertEquals(TableStatus.OCCUPIED, table.getStatus());
    }

    @Test
    void orderOpenIsIdempotentWhenOrderExists() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(FloorOrder.builder().id(orderId).build()));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("tableId", "5");

        applicator.apply(10, 1, "ORDER_OPEN", payload.toString());

        verify(orderRepository, never()).save(any());
    }

    @Test
    void orderAddItemCreatesLineWithClientIdWithoutReprint() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID itemId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        UUID menuItemId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        FloorOrder order = FloorOrder.builder()
            .id(orderId)
            .companyId(10)
            .storeId(1)
            .status(OrderStatus.OPEN)
            .build();
        MenuItem menuItem = MenuItem.builder()
            .id(menuItemId)
            .companyId(10)
            .storeId(1)
            .name("Plov")
            .price(new BigDecimal("25000"))
            .taxRate(BigDecimal.ZERO)
            .build();

        when(itemRepository.findById(itemId)).thenReturn(Optional.empty());
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(menuItemRepository.findByIdAndCompanyId(menuItemId, 10)).thenReturn(Optional.of(menuItem));
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of());
        when(itemRepository.save(any(FloorOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("itemId", itemId.toString())
            .put("menuItemId", menuItemId.toString())
            .put("name", "Plov")
            .put("quantity", 2)
            .put("unitPrice", 25000);

        applicator.apply(10, 1, "ORDER_ADD_ITEM", payload.toString());

        ArgumentCaptor<FloorOrderItem> cap = ArgumentCaptor.forClass(FloorOrderItem.class);
        verify(itemRepository).save(cap.capture());
        FloorOrderItem line = cap.getValue();
        assertEquals(itemId, line.getId());
        assertEquals(orderId, line.getOrder().getId());
        assertEquals(0, new BigDecimal("2.000").compareTo(line.getQuantity()));
        assertEquals("Plov", line.getName());
    }

    @Test
    void orderAddItemIsIdempotentWhenItemExists() {
        UUID itemId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(FloorOrderItem.builder().id(itemId).build()));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", "11111111-1111-1111-1111-111111111111")
            .put("itemId", itemId.toString());

        applicator.apply(10, 1, "ORDER_ADD_ITEM", payload.toString());

        verify(itemRepository, never()).save(any());
    }

    @Test
    void orderUpdateItemChangesQuantity() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID itemId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .quantity(new BigDecimal("1.000"))
            .sentQuantity(BigDecimal.ZERO)
            .itemStatus(com.pos.restaurant.order.domain.OrderItemStatus.NEW)
            .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemRepository.save(any(FloorOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("itemId", itemId.toString())
            .put("quantity", 4)
            .put("note", "без лука");

        applicator.apply(10, 1, "ORDER_UPDATE_ITEM", payload.toString());

        assertEquals(0, new BigDecimal("4.000").compareTo(item.getQuantity()));
        assertEquals("без лука", item.getNote());
        verify(itemRepository).save(item);
    }

    @Test
    void orderCancelItemDeletesNewLine() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID itemId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(itemId)
            .order(order)
            .itemStatus(com.pos.restaurant.order.domain.OrderItemStatus.NEW)
            .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("itemId", itemId.toString())
            .put("deleted", true);

        applicator.apply(10, 1, "ORDER_CANCEL_ITEM", payload.toString());

        verify(itemRepository).delete(item);
        verify(itemRepository, never()).save(any());
    }

    @Test
    void orderCancelMarksOrderAndFreesTable() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        FloorTable table = FloorTable.builder().id(5).companyId(10).storeId(1).status(TableStatus.OCCUPIED).build();
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.OPEN).table(table).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.fromString("33333333-3333-3333-3333-333333333333"))
            .order(order)
            .itemStatus(com.pos.restaurant.order.domain.OrderItemStatus.NEW)
            .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(itemRepository.save(any(FloorOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode().put("orderId", orderId.toString());
        applicator.apply(10, 1, "ORDER_CANCEL", payload.toString());

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(TableStatus.FREE, table.getStatus());
        assertEquals(com.pos.restaurant.order.domain.OrderItemStatus.CANCELLED, item.getItemStatus());
    }

    @Test
    void orderPaySetsBillingThenDelegatesToPayHandler() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.OPEN).build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(FloorOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("method", "CASH")
            .put("amount", 25000)
            .put("cashAmount", 25000)
            .put("cardAmount", 0);

        applicator.apply(10, 1, "ORDER_PAY", payload.toString());

        assertEquals(OrderStatus.BILLING, order.getStatus());
        verify(payOrderHandler).handle(eq(orderId), any());
    }

    @Test
    void orderPayIsNoOpWhenAlreadyClosed() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.CLOSED).build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        ObjectNode payload = objectMapper.createObjectNode()
            .put("orderId", orderId.toString())
            .put("method", "CASH")
            .put("amount", 1000);

        applicator.apply(10, 1, "ORDER_PAY", payload.toString());

        verify(payOrderHandler, never()).handle(any(), any());
    }

    @Test
    void sendKitchenMarksNewItemsSent() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        FloorOrder order = FloorOrder.builder()
            .id(orderId).companyId(10).storeId(1).status(OrderStatus.OPEN).build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.fromString("33333333-3333-3333-3333-333333333333"))
            .order(order)
            .quantity(new BigDecimal("2"))
            .sentQuantity(BigDecimal.ZERO)
            .itemStatus(com.pos.restaurant.order.domain.OrderItemStatus.NEW)
            .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId)).thenReturn(List.of(item));
        when(itemRepository.save(any(FloorOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        ObjectNode payload = objectMapper.createObjectNode().put("orderId", orderId.toString());
        applicator.apply(10, 1, "ORDER_SEND_KITCHEN", payload.toString());

        assertEquals(com.pos.restaurant.order.domain.OrderItemStatus.SENT_TO_KITCHEN, item.getItemStatus());
        assertEquals(0, new BigDecimal("2").compareTo(item.getSentQuantity()));
    }

    @Test
    void malformedPayloadDoesNotThrow() {
        applicator.apply(10, 1, "ORDER_OPEN", "{not-json");
        verify(orderRepository, never()).save(any());
    }
}
