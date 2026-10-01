package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Cashier journal: orders cancelled from floor / waiter / cashier (table refusals).
 */
@Component
@RequiredArgsConstructor
public class ListRecentCancelledOrdersHandler {

    private static final int DEFAULT_LIMIT = 40;
    private static final int MAX_LIMIT = 100;

    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorTenantSupport tenantSupport;
    private final OrderTotals orderTotals;

    @Transactional(readOnly = true)
    public List<PaidOrderSummaryResponse> handle(Integer storeId, Integer limit) {
        Integer companyId = tenantSupport.requireCompanyId();
        int size = limit == null ? DEFAULT_LIMIT : Math.min(Math.max(limit, 1), MAX_LIMIT);
        List<FloorOrder> orders = orderRepository.findRecentCancelledByCompanyIdAndStoreId(
            companyId,
            storeId,
            PageRequest.of(0, size)
        );
        if (orders.isEmpty()) {
            return List.of();
        }
        List<UUID> orderIds = orders.stream().map(FloorOrder::getId).toList();
        Map<UUID, List<FloorOrderItem>> itemsByOrder = itemRepository.findByOrderIdInOrdered(orderIds).stream()
            .collect(Collectors.groupingBy(item -> item.getOrder().getId()));

        return orders.stream()
            .map(order -> toSummary(order, itemsByOrder.getOrDefault(order.getId(), List.of())))
            .toList();
    }

    private PaidOrderSummaryResponse toSummary(FloorOrder order, List<FloorOrderItem> items) {
        BigDecimal subtotal = items.stream()
            .map(orderTotals::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
        BigDecimal service = order.getServiceAmount() != null
            ? order.getServiceAmount()
            : (order.getCommissionAmount() == null ? BigDecimal.ZERO : order.getCommissionAmount());
        BigDecimal total = subtotal.add(service).setScale(2, RoundingMode.HALF_UP);
        String tableCode = order.getTable() == null ? null : order.getTable().getCode();
        Integer tableId = order.getTable() == null ? null : order.getTable().getId();
        return new PaidOrderSummaryResponse(
            order.getId(),
            order.getOrderNo(),
            order.getChannel(),
            tableId,
            tableCode,
            order.getStoreId(),
            order.getStatus(),
            order.getClientName(),
            order.getClosedAt() != null ? order.getClosedAt() : order.getOpenedAt(),
            subtotal,
            order.getCommissionAmount(),
            total,
            null,
            total
        );
    }
}
