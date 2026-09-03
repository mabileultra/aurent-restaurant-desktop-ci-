package com.pos.restaurant.revenue.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.shared.event.SaleCompletedEvent;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RestaurantSaleCompletedFactoryTest {

    private final RestaurantSaleCompletedFactory factory = new RestaurantSaleCompletedFactory(new OrderTotals());

    @Test
    void mapsCardPaymentAndSkipsCancelledLines() {
        UUID orderId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID userId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        FloorOrder order = FloorOrder.builder()
            .id(orderId)
            .companyId(9)
            .storeId(4)
            .orderNo(18)
            .closedAt(Instant.parse("2026-09-03T21:00:00Z"))
            .build();
        FloorOrderItem kept = FloorOrderItem.builder()
            .name("Lagman")
            .quantity(new BigDecimal("2"))
            .unitPrice(new BigDecimal("25000.00"))
            .itemStatus(OrderItemStatus.SERVED)
            .build();
        FloorOrderItem cancelled = FloorOrderItem.builder()
            .name("Tea")
            .quantity(BigDecimal.ONE)
            .unitPrice(new BigDecimal("5000.00"))
            .itemStatus(OrderItemStatus.CANCELLED)
            .build();
        FloorOrderPayment payment = FloorOrderPayment.builder()
            .method(PaymentMethod.CARD)
            .amount(new BigDecimal("50000.00"))
            .paidByUserId(userId)
            .paidAt(Instant.parse("2026-09-03T21:00:00Z"))
            .build();

        SaleCompletedEvent event = factory.fromPaidOrder(order, List.of(kept, cancelled), payment);

        assertEquals(orderId, event.saleId());
        assertEquals("RST-4-18", event.receiptNumber());
        assertEquals(new BigDecimal("50000.00"), event.totalAmount());
        assertEquals(BigDecimal.ZERO, event.cashAmount());
        assertEquals(new BigDecimal("50000.00"), event.cardAmount());
        assertEquals("CARD", event.paymentMethod());
        assertEquals(2L, event.itemsSold());
        assertEquals(1, event.lines().size());
        assertEquals("Lagman", event.lines().get(0).productName());
        assertEquals("Restaurant", event.lines().get(0).categoryName());
        assertEquals(BigDecimal.ZERO, event.lines().get(0).costEstimate());
        assertNull(event.storeName());
    }

    @Test
    void fractionalQuantityCountsAsOneUnit() {
        assertEquals(1L, RestaurantSaleCompletedFactory.reportableQty(new BigDecimal("0.3")));
        assertEquals(2L, RestaurantSaleCompletedFactory.reportableQty(new BigDecimal("1.5")));
    }
}
