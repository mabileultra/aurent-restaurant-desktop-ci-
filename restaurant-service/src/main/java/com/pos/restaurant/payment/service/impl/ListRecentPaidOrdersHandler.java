package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.repository.FloorOrderRepository;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PaidOrderSummaryResponse;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.shared.api.PageLimits;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ListRecentPaidOrdersHandler {

    private final FloorOrderRepository orderRepository;
    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderPaymentRepository paymentRepository;
    private final FloorTenantSupport tenantSupport;
    private final OrderTotals orderTotals;

    @Transactional(readOnly = true)
    public List<PaidOrderSummaryResponse> handle(Integer storeId, boolean refunded, Integer limit) {
        Integer companyId = tenantSupport.requireCompanyId();
        int size = limit == null ? 40 : PageLimits.normalizeSize(limit);
        List<FloorOrder> orders = refunded
            ? orderRepository.findRecentRefundedByCompanyIdAndStoreId(
                companyId,
                storeId,
                PageRequest.of(0, size)
            )
            : orderRepository.findRecentByCompanyIdAndStoreIdAndStatusIn(
                companyId,
                storeId,
                List.of(OrderStatus.CLOSED),
                PageRequest.of(0, size)
            );
        if (orders.isEmpty()) {
            return List.of();
        }
        List<UUID> orderIds = orders.stream().map(FloorOrder::getId).toList();
        Map<UUID, FloorOrderPayment> payments = paymentRepository.findByOrder_IdIn(orderIds).stream()
            .collect(Collectors.toMap(
                p -> p.getOrder().getId(),
                Function.identity(),
                (a, b) -> a.getPaidAt().isAfter(b.getPaidAt()) ? a : b
            ));
        Map<UUID, List<FloorOrderItem>> itemsByOrder = orders.stream()
            .anyMatch(order -> payments.get(order.getId()) == null || payments.get(order.getId()).getAmount() == null)
            ? itemRepository.findByOrderIdInOrdered(orderIds).stream()
                .collect(Collectors.groupingBy(item -> item.getOrder().getId()))
            : Map.of();

        return orders.stream()
            .map(order -> toSummary(
                order,
                payments.get(order.getId()),
                itemsByOrder.getOrDefault(order.getId(), List.of())
            ))
            .toList();
    }

    private PaidOrderSummaryResponse toSummary(
        FloorOrder order,
        FloorOrderPayment payment,
        List<FloorOrderItem> items
    ) {
        BigDecimal service = order.getServiceAmount() != null
            ? order.getServiceAmount()
            : (order.getCommissionAmount() == null ? BigDecimal.ZERO : order.getCommissionAmount());
        BigDecimal subtotal;
        BigDecimal paidAmount;
        if (payment != null && payment.getAmount() != null) {
            paidAmount = payment.getAmount();
            subtotal = paidAmount.subtract(service).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        } else {
            subtotal = orderTotals.billable(items);
            paidAmount = subtotal.add(service).setScale(2, RoundingMode.HALF_UP);
        }
        PaymentMethod method = payment == null ? null : payment.getMethod();
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
            paidAmount,
            method,
            paidAmount,
            payment == null ? null : payment.getDebtPhone(),
            payment == null ? null : payment.getDebtComment(),
            payment == null ? null : payment.getAdvancePaid(),
            payment == null ? null : payment.getDebtRemaining()
        );
    }
}
