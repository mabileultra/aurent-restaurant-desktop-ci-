package com.pos.restaurant.order.service.impl;

import com.pos.restaurant.exception.ForbiddenException;
import com.pos.restaurant.exception.NotFoundException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.dto.UpdateOrderItemRequest;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderItemMutabilityPolicy;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.WeightSaleSupport;
import com.pos.restaurant.print.service.PrintJobPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OrderUpdateItemHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final OrderItemMutabilityPolicy mutabilityPolicy;
    private final OrderResponseAssembler assembler;
    private final FloorTenantSupport tenantSupport;
    private final PrintJobPublisher printJobPublisher;

    @Transactional
    public OrderResponse handle(UUID orderId, UUID itemId, UpdateOrderItemRequest request) {
        FloorOrder order = orderLookup.requireActive(orderId);
        FloorOrderItem item = itemRepository.findByIdAndOrderId(itemId, orderId)
            .orElseThrow(() -> new NotFoundException("Order item not found: " + itemId));

        var qty = request.quantity().setScale(3, RoundingMode.HALF_UP);
        BigDecimal sent = item.getSentQuantity() == null ? BigDecimal.ZERO : item.getSentQuantity();
        BigDecimal previousQty = item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity();

        if (item.getItemStatus() == OrderItemStatus.NEW) {
            mutabilityPolicy.assertMutable(item);
        } else if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
            throw new ForbiddenException("Cannot change a cancelled item");
        } else if (!tenantSupport.canCancelOrdersWithItems()) {
            // Waiter: only the unsent reorder delta (cannot go below already sent).
            if (qty.compareTo(sent) < 0) {
                throw new ForbiddenException("Only a manager or cashier can change a kitchen item");
            }
        } else if (qty.compareTo(previousQty) < 0) {
            // Cashier/manager kitchen cut: void delta on category printer + journal sibling.
            BigDecimal refused = previousQty.subtract(qty);
            printJobPublisher.voidSlipsForItems(order, List.of(item), Map.of(item.getId(), refused));
            recordKitchenRefuse(order, item, refused);
            if (qty.compareTo(sent) < 0) {
                item.setSentQuantity(qty);
            }
        }

        item.setQuantity(qty);
        if (item.getSentQuantity() != null && item.getSentQuantity().compareTo(qty) > 0) {
            item.setSentQuantity(qty);
        }
        if (WeightSaleSupport.isWeightSold(item.getMenuItem())) {
            item.setNote(WeightSaleSupport.noteForQuantity(item.getMenuItem(), qty));
        } else if (request.note() != null && item.getItemStatus() == OrderItemStatus.NEW) {
            item.setNote(request.note().isBlank() ? null : request.note().trim());
        }
        return assembler.toResponse(order, itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId));
    }

    private void recordKitchenRefuse(FloorOrder order, FloorOrderItem source, BigDecimal refusedQty) {
        if (refusedQty == null || refusedQty.signum() <= 0) {
            return;
        }
        String note = WeightSaleSupport.isWeightSold(source.getMenuItem())
            ? WeightSaleSupport.noteForQuantity(source.getMenuItem(), refusedQty)
            : source.getNote();
        itemRepository.save(FloorOrderItem.builder()
            .order(order)
            .menuItem(source.getMenuItem())
            .name(source.getName())
            .quantity(refusedQty)
            .sentQuantity(refusedQty)
            .unitPrice(source.getUnitPrice() == null ? BigDecimal.ZERO : source.getUnitPrice())
            .taxRate(source.getTaxRate() == null ? BigDecimal.ZERO : source.getTaxRate())
            .stationId(source.getStationId())
            .note(note)
            .itemStatus(OrderItemStatus.CANCELLED)
            .sortOrder(source.getSortOrder())
            .build());
    }
}
