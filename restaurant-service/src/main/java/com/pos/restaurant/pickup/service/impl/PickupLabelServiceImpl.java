package com.pos.restaurant.pickup.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.pickup.service.PickupLabelService;
import com.pos.restaurant.pickup.support.PickupLabelPolicy;
import com.pos.restaurant.pickup.support.PickupNumberIssuer;
import com.pos.restaurant.print.service.PrintJobPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PickupLabelServiceImpl implements PickupLabelService {

    private final PickupLabelPolicy policy;
    private final PickupNumberIssuer numberIssuer;
    private final PrintJobPublisher printJobPublisher;
    private final OrderLookup orderLookup;
    private final FloorOrderItemRepository itemRepository;
    private final OrderResponseAssembler assembler;

    @Override
    @Transactional
    public void assignAndEnqueue(FloorOrder order, List<FloorOrderItem> items) {
        if (!policy.canAssign(order) || policy.alreadyNumbered(order)) {
            return;
        }
        numberIssuer.assignOnce(order);
        printJobPublisher.pickupLabel(order, printableItems(items));
    }

    @Override
    @Transactional
    public OrderResponse reprint(UUID orderId) {
        if (!policy.canUseFeature()) {
            throw new BusinessException("Pickup labels are not enabled for this login");
        }
        FloorOrder order = orderLookup.require(orderId);
        if (!policy.canAssign(order) && !policy.alreadyNumbered(order)) {
            throw new BusinessException("Pickup labels are only for takeaway and delivery");
        }
        if (!policy.alreadyNumbered(order)) {
            if (!policy.canAssign(order)) {
                throw new BusinessException("Pickup labels are only for takeaway and delivery");
            }
            numberIssuer.assignOnce(order);
        }
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        printJobPublisher.pickupLabel(order, printableItems(items));
        return assembler.toResponse(order, items);
    }

    private static List<FloorOrderItem> printableItems(List<FloorOrderItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream()
            .filter(item -> item.getItemStatus() != OrderItemStatus.CANCELLED)
            .filter(item -> item.getQuantity() != null && item.getQuantity().signum() > 0)
            .toList();
    }
}
