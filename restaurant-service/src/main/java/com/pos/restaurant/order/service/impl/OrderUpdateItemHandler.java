package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderItemMutabilityPolicy;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderUpdateItemHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderItemMutabilityPolicy mutabilityPolicy;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId, UUID itemId, UpdateOrderItemRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        FloorOrderItem item = itemRepository.findByIdAndOrderId(itemId, orderId)
            .orElseThrow(() -> new NotFoundException("Order item not found: " + itemId));
        mutabilityPolicy.assertMutable(item);
        item.setQuantity(request.quantity().setScale(3, RoundingMode.HALF_UP));
        if (request.note() != null) {
            item.setNote(request.note().isBlank() ? null : request.note().trim());
        }
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }
}
