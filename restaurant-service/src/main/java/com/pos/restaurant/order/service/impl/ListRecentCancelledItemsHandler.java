package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.dto.CancelledItemSummaryResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.shared.api.PageLimits;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Cashier journal: cancelled dishes (kitchen refuse, qty cut, full table cancel).
 */
@Component
@RequiredArgsConstructor
public class ListRecentCancelledItemsHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorTenantSupport tenantSupport;
    private final OrderTotals orderTotals;

    @Transactional(readOnly = true)
    public List<CancelledItemSummaryResponse> handle(Integer storeId, Integer limit) {
        Integer companyId = tenantSupport.requireCompanyId();
        int size = limit == null ? 80 : PageLimits.normalizeReportSize(limit);
        return itemRepository
            .findRecentCancelledByCompanyIdAndStoreId(companyId, storeId, PageRequest.of(0, size))
            .stream()
            .map(this::toSummary)
            .toList();
    }

    private CancelledItemSummaryResponse toSummary(FloorOrderItem item) {
        FloorOrder order = item.getOrder();
        String tableCode = order.getTable() == null ? null : order.getTable().getCode();
        Integer tableId = order.getTable() == null ? null : order.getTable().getId();
        String hallName = order.getTable() == null || order.getTable().getHall() == null
            ? null
            : order.getTable().getHall().getName();
        return new CancelledItemSummaryResponse(
            item.getId(),
            order.getId(),
            order.getOrderNo(),
            order.getChannel(),
            item.getName(),
            item.getQuantity(),
            item.getUnitPrice(),
            orderTotals.lineTotal(item),
            tableId,
            tableCode,
            hallName,
            item.getUpdatedAt(),
            order.getWaiterUserId()
        );
    }
}
