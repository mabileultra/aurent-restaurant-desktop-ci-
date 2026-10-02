package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.entity.FloorHall;
import com.pos.restaurant.floor.entity.FloorTable;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.CancelledItemSummaryResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderTotals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListRecentCancelledItemsHandlerTest {

    @Mock private FloorOrderItemRepository itemRepository;
    @Mock private FloorTenantSupport tenantSupport;
    @Mock private OrderTotals orderTotals;

    @InjectMocks
    private ListRecentCancelledItemsHandler handler;

    @Test
    void mapsHallTableTimeAndAmount() {
        when(tenantSupport.requireCompanyId()).thenReturn(1);
        FloorHall hall = FloorHall.builder().id(9).name("1 qavat").build();
        FloorTable table = FloorTable.builder().id(5).code("12").hall(hall).build();
        FloorOrder order = FloorOrder.builder()
            .id(UUID.randomUUID())
            .orderNo(85)
            .channel(OrderChannel.DINE_IN)
            .status(OrderStatus.OPEN)
            .table(table)
            .waiterUserId(UUID.randomUUID())
            .build();
        Instant cancelledAt = Instant.parse("2026-10-02T18:00:00Z");
        FloorOrderItem item = FloorOrderItem.builder()
            .id(UUID.randomUUID())
            .order(order)
            .name("Salat")
            .quantity(BigDecimal.ONE)
            .unitPrice(new BigDecimal("25000"))
            .itemStatus(OrderItemStatus.CANCELLED)
            .updatedAt(cancelledAt)
            .build();
        when(itemRepository.findRecentCancelledByCompanyIdAndStoreId(eq(1), eq(2), any(Pageable.class)))
            .thenReturn(List.of(item));
        when(orderTotals.lineTotal(item)).thenReturn(new BigDecimal("25000.00"));

        List<CancelledItemSummaryResponse> rows = handler.handle(2, 50);

        assertEquals(1, rows.size());
        CancelledItemSummaryResponse row = rows.get(0);
        assertEquals(item.getId(), row.id());
        assertEquals(order.getId(), row.orderId());
        assertEquals(85, row.orderNo());
        assertEquals("Salat", row.itemName());
        assertEquals("12", row.tableCode());
        assertEquals("1 qavat", row.hallName());
        assertEquals(cancelledAt, row.cancelledAt());
        assertEquals(0, row.lineTotal().compareTo(new BigDecimal("25000.00")));
    }
}
