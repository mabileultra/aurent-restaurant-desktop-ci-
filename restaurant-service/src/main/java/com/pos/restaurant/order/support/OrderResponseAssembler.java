package com.pos.restaurant.order.support;

import com.pos.restaurant.order.dto.OrderItemModifierResponse;
import com.pos.restaurant.order.dto.OrderItemResponse;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.entity.FloorOrderItemModifier;
import com.pos.restaurant.order.repository.FloorOrderItemModifierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderResponseAssembler {

    private final FloorOrderItemModifierRepository modifierRepository;
    private final OrderTotals orderTotals;

    public OrderResponse toResponse(FloorOrder order, List<FloorOrderItem> items) {
        Map<UUID, List<FloorOrderItemModifier>> modifiers = items.isEmpty()
            ? Map.of()
            : modifierRepository.findByOrderItemIdIn(items.stream().map(FloorOrderItem::getId).toList()).stream()
                .collect(Collectors.groupingBy(mod -> mod.getOrderItem().getId()));
        List<OrderItemResponse> itemResponses = items.stream()
            .map(item -> toItem(item, modifiers.getOrDefault(item.getId(), List.of())))
            .toList();
        return new OrderResponse(
            order.getId(),
            order.getOrderNo(),
            order.getTable().getId(),
            order.getTable().getCode(),
            order.getStoreId(),
            order.getStatus(),
            order.getGuestCount(),
            order.getAdultCount(),
            order.getChildrenCount(),
            order.getOpenedByUserId(),
            order.getWaiterUserId(),
            order.getComment(),
            order.getOpenedAt(),
            order.getClosedAt(),
            orderTotals.billable(items),
            itemResponses.size(),
            itemResponses
        );
    }

    public OrderItemResponse toItem(FloorOrderItem item, List<FloorOrderItemModifier> modifiers) {
        UUID menuItemId = item.getMenuItem() == null ? null : item.getMenuItem().getId();
        return new OrderItemResponse(
            item.getId(),
            menuItemId,
            item.getName(),
            item.getQuantity(),
            item.getUnitPrice(),
            lineTotal(item.getQuantity(), item.getUnitPrice()),
            item.getNote(),
            item.getItemStatus(),
            item.getSortOrder(),
            item.getStationId(),
            modifiers.stream()
                .map(mod -> new OrderItemModifierResponse(mod.getId(), mod.getName(), mod.getPriceDelta()))
                .toList()
        );
    }

    public BigDecimal lineTotal(BigDecimal quantity, BigDecimal unitPrice) {
        return quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
    }
}
