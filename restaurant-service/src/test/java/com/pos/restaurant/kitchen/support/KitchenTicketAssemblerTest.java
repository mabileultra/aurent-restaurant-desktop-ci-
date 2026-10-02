package com.pos.restaurant.kitchen.support;

import com.pos.restaurant.kitchen.domain.KitchenTicketStatus;
import com.pos.restaurant.kitchen.dto.KitchenTicketLineResponse;
import com.pos.restaurant.kitchen.dto.KitchenTicketResponse;
import com.pos.restaurant.kitchen.entity.KitchenTicket;
import com.pos.restaurant.kitchen.entity.KitchenTicketLine;
import com.pos.restaurant.menu.domain.MenuPortionUnit;
import com.pos.restaurant.menu.entity.MenuItem;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class KitchenTicketAssemblerTest {

    private final KitchenTicketAssembler assembler = new KitchenTicketAssembler();

    @Test
    void usesTicketLineQuantitySnapshotNotLiveOrderQty() {
        FloorOrder order = FloorOrder.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .orderNo(7)
            .channel(OrderChannel.DINE_IN)
            .status(OrderStatus.OPEN)
            .build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .name("BIQIN")
            .quantity(new BigDecimal("5"))
            .sentQuantity(new BigDecimal("5"))
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();
        KitchenTicket ticket = KitchenTicket.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .order(order)
            .status(KitchenTicketStatus.NEW)
            .build();
        KitchenTicketLine line = KitchenTicketLine.builder()
            .id(UUID.randomUUID())
            .ticket(ticket)
            .orderItem(item)
            .quantity(BigDecimal.ONE)
            .build();

        KitchenTicketResponse response = assembler.toResponse(ticket, List.of(line), Map.of());
        KitchenTicketLineResponse out = response.lines().get(0);

        assertEquals(line.getId(), out.id());
        assertEquals(item.getId(), out.orderItemId());
        assertEquals(0, out.quantity().compareTo(BigDecimal.ONE));
    }

    @Test
    void weightReorderShowsDeltaNoteNotOrderLineTotal() {
        FloorOrder order = FloorOrder.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .orderNo(7)
            .channel(OrderChannel.DINE_IN)
            .status(OrderStatus.OPEN)
            .build();
        MenuItem menuItem = MenuItem.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .name("Lagman")
            .portionUnit(MenuPortionUnit.KG)
            .portionAmount(BigDecimal.ONE)
            .price(new BigDecimal("12000"))
            .build();
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .menuItem(menuItem)
            .name("Lagman")
            .quantity(new BigDecimal("2"))
            .sentQuantity(new BigDecimal("2"))
            .note("2 кг")
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .build();
        KitchenTicket ticket = KitchenTicket.builder()
            .id(UUID.randomUUID())
            .companyId(1)
            .storeId(2)
            .order(order)
            .status(KitchenTicketStatus.NEW)
            .build();
        KitchenTicketLine line = KitchenTicketLine.builder()
            .id(UUID.randomUUID())
            .ticket(ticket)
            .orderItem(item)
            .quantity(BigDecimal.ONE)
            .build();

        KitchenTicketLineResponse out = assembler.toResponse(ticket, List.of(line), Map.of()).lines().get(0);

        assertEquals(0, out.quantity().compareTo(BigDecimal.ONE));
        assertEquals("1 кг", out.note());
    }
}
