package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.payment.support.BillEligibilityPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RequestBillHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final BillEligibilityPolicy eligibilityPolicy;
    private final OrderResponseAssembler assembler;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        FloorOrder order = orderLookup.requireOpen(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        eligibilityPolicy.assertCanRequestBill(order, items);
        order.setStatus(OrderStatus.BILLING);
        if (order.getTable() != null) {
            order.getTable().setStatus(TableStatus.WAITING_PAYMENT);
        }
        LogUtil.info(RequestBillHandler.class, "Bill requested: orderId={}", orderId);
        return assembler.toResponse(order, items);
    }
}
