package com.pos.restaurant.order.support;

import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.entity.FloorOrderItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class OrderTotals {

    public BigDecimal billable(List<FloorOrderItem> items) {
        return items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .map(this::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal lineTotal(FloorOrderItem item) {
        return item.getQuantity().multiply(item.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
    }
}
