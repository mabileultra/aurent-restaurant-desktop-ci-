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
import com.pos.restaurant.order.support.ServiceChargeSupport;
import com.pos.restaurant.order.support.TableSeatSync;
import com.pos.restaurant.payment.support.BillEligibilityPolicy;
import com.pos.restaurant.payment.support.BillRequestAccess;
import com.pos.restaurant.print.service.PrintJobPublisher;
import com.pos.restaurant.settings.service.KitchenBoardService;
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
    private final BillRequestAccess billRequestAccess;
    private final OrderResponseAssembler assembler;
    private final OrderLinkedTablesSupport linkedTables;
    private final OrderTotals orderTotals;
    private final WaiterCommissionService waiterCommissionService;
    private final KitchenBoardService kitchenBoardService;
    private final ServiceChargeSupport serviceChargeSupport;
    private final TableSeatSync tableSeatSync;
    private final PrintJobPublisher printJobPublisher;

    @Transactional
    public OrderResponse handle(UUID orderId) {
        billRequestAccess.assertAllowed();
        FloorOrder order = orderLookup.requireActive(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        boolean kitchenBoard = kitchenBoardService.isEnabled(order.getCompanyId(), order.getStoreId());
        eligibilityPolicy.assertCanRequestBill(order, items, kitchenBoard);
        BigDecimal subtotal = orderTotals.billable(items);
        waiterCommissionService.applyOnPayment(order, subtotal);
        serviceChargeSupport.snapshot(order, subtotal);
        order.setStatus(OrderStatus.BILLING);
        tableSeatSync.refresh(linkedTables.allTables(order), TableStatus.WAITING_PAYMENT);
        LogUtil.info(RequestBillHandler.class, "Bill requested: orderId={}", orderId);
        printJobPublisher.guestBill(order);
        return assembler.toResponse(order, items, linkedTables.allTables(order));
    }
}
