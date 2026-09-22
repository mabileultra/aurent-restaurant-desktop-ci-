package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.commission.service.WaiterCommissionService;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.support.BillEligibilityPolicy;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RequestBillHandler {

    private final FloorOrderItemRepository itemRepository;
    private final OrderLookup orderLookup;
    private final BillEligibilityPolicy eligibilityPolicy;
    private final OrderResponseAssembler assembler;
    private final OrderLinkedTablesSupport linkedTables;
    private final OrderTotals orderTotals;
    private final WaiterCommissionService waiterCommissionService;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        FloorOrder order = orderLookup.requireOpen(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        eligibilityPolicy.assertCanRequestBill(order, items);
        BigDecimal subtotal = orderTotals.billable(items);
        waiterCommissionService.applyOnPayment(order, subtotal);
        order.setStatus(OrderStatus.BILLING);
        linkedTables.applyStatus(order, TableStatus.WAITING_PAYMENT);
        LogUtil.info(RequestBillHandler.class, "Bill requested: orderId={}", orderId);
        return assembler.toResponse(order, items, linkedTables.allTables(order));
    }
}
