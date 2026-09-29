package com.pos.restaurant.payment.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class BillEligibilityPolicy {

    public void assertCanRequestBill(FloorOrder order, List<FloorOrderItem> items, boolean ignoredKitchenBoardEnabled) {
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new BusinessException("Bill can be requested only for an open order");
        }
        List<FloorOrderItem> billable = items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .toList();
        if (billable.isEmpty()) {
            throw new BusinessException("Cannot request a bill for an empty order");
        }
        boolean hasUnsent = billable.stream().anyMatch(item -> item.getItemStatus() == OrderItemStatus.NEW);
        if (hasUnsent) {
            throw new BusinessException("Send new items to the kitchen before requesting the bill");
        }
    }

    public void assertCanPay(FloorOrder order, BigDecimal due, BigDecimal amount) {
        if (order.getStatus() != OrderStatus.BILLING) {
            throw new BusinessException("Request the bill before taking payment");
        }
        if (due.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Nothing to pay");
        }
        BigDecimal dueScaled = due.setScale(2, RoundingMode.HALF_UP);
        BigDecimal amountScaled = amount.setScale(2, RoundingMode.HALF_UP);
        if (amountScaled.compareTo(dueScaled) != 0) {
            throw new BusinessException("Payment amount must equal the bill total");
        }
    }
}
