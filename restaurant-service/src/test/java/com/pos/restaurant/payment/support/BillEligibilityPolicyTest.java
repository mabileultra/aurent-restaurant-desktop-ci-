package com.pos.restaurant.payment.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BillEligibilityPolicyTest {

    private final BillEligibilityPolicy policy = new BillEligibilityPolicy();

    @Test
    void requestBill_requiresOpenOrderWithSentItems() {
        FloorOrder order = FloorOrder.builder().status(OrderStatus.OPEN).build();
        FloorOrderItem sent = FloorOrderItem.builder()
            .itemStatus(OrderItemStatus.SENT_TO_KITCHEN)
            .quantity(BigDecimal.ONE)
            .unitPrice(new BigDecimal("10.00"))
            .build();
        assertDoesNotThrow(() -> policy.assertCanRequestBill(order, List.of(sent), true));
    }

    @Test
    void requestBill_rejectsUnsentItems() {
        FloorOrder order = FloorOrder.builder().status(OrderStatus.OPEN).build();
        FloorOrderItem unsent = FloorOrderItem.builder()
            .itemStatus(OrderItemStatus.NEW)
            .quantity(BigDecimal.ONE)
            .unitPrice(new BigDecimal("10.00"))
            .build();
        assertThrows(BusinessException.class, () -> policy.assertCanRequestBill(order, List.of(unsent), true));
        assertThrows(BusinessException.class, () -> policy.assertCanRequestBill(order, List.of(unsent), false));
    }

    @Test
    void pay_requiresExactAmountOnBillingOrder() {
        FloorOrder order = FloorOrder.builder().status(OrderStatus.BILLING).build();
        BigDecimal due = new BigDecimal("25.00");
        assertDoesNotThrow(() -> policy.assertCanPay(order, due, due));
        assertThrows(BusinessException.class, () -> policy.assertCanPay(order, due, new BigDecimal("20.00")));
        assertDoesNotThrow(() -> policy.assertCanPay(order, due, new BigDecimal("25.0")));
        assertThrows(BusinessException.class, () -> policy.assertCanPay(
            FloorOrder.builder().status(OrderStatus.OPEN).build(),
            due,
            due
        ));
    }
}
