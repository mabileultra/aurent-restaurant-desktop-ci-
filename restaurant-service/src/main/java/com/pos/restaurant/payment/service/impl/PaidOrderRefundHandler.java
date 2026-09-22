package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.payment.dto.PartialRefundLineRequest;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaidOrderRefundHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final PaidOrderPartialRefundHandler partialRefundHandler;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        orderLookup.requireClosed(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        List<PartialRefundLineRequest> lines = items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .map(item -> {
                BigDecimal returned = item.getReturnedQuantity() == null
                    ? BigDecimal.ZERO
                    : item.getReturnedQuantity();
                BigDecimal remaining = item.getQuantity().subtract(returned);
                if (remaining.signum() <= 0) {
                    return null;
                }
                return new PartialRefundLineRequest(item.getId(), remaining);
            })
            .filter(line -> line != null)
            .toList();
        if (lines.isEmpty()) {
            throw new BusinessException("По этому заказу нечего возвращать");
        }
        return partialRefundHandler.handle(orderId, new PartialRefundRequest("full", lines));
    }
}
