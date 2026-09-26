package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.commission.service.WaiterCommissionService;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLinkedTablesSupport;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.order.support.OrderTotals;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.payment.support.BillEligibilityPolicy;
import com.pos.restaurant.payment.support.PaymentSplitPolicy;
import com.pos.restaurant.recipe.service.RecipeConsumePublicationService;
import com.pos.restaurant.revenue.service.RevenuePublicationService;
import com.pos.restaurant.shift.support.ShiftLookup;
import com.pos.restaurant.shift.support.ShiftSaleAccumulator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PayOrderHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderPaymentRepository paymentRepository;
    private final OrderLookup orderLookup;
    private final FloorTenantSupport tenantSupport;
    private final BillEligibilityPolicy eligibilityPolicy;
    private final PaymentSplitPolicy paymentSplitPolicy;
    private final OrderTotals orderTotals;
    private final OrderResponseAssembler assembler;
    private final RevenuePublicationService revenuePublicationService;
    private final RecipeConsumePublicationService recipeConsumePublicationService;
    private final ShiftLookup shiftLookup;
    private final ShiftSaleAccumulator shiftSaleAccumulator;
    private final WaiterCommissionService waiterCommissionService;
    private final OrderLinkedTablesSupport linkedTables;

    @Transactional
    public OrderResponse handle(UUID orderId, PayOrderRequest request) {
        FloorOrder order = orderLookup.requireBilling(orderId);
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        BigDecimal subtotal = orderTotals.billable(items);
        waiterCommissionService.applyOnPayment(order, subtotal);
        BigDecimal service = order.getCommissionAmount() == null ? BigDecimal.ZERO : order.getCommissionAmount();
        BigDecimal discount = order.getDiscountAmount() == null ? BigDecimal.ZERO : order.getDiscountAmount();
        BigDecimal due = subtotal.add(service).subtract(discount).setScale(2, RoundingMode.HALF_UP);
        if (due.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Nothing to pay after discount");
        }
        eligibilityPolicy.assertCanPay(order, due, request.amount());
        PaymentSplitPolicy.Split split = paymentSplitPolicy.resolve(request, due);
        FloorOrderPayment payment = paymentRepository.save(FloorOrderPayment.builder()
            .order(order)
            .method(request.method())
            .amount(due)
            .cashAmount(split.cashAmount())
            .cardAmount(split.cardAmount())
            .amountTendered(split.amountTendered())
            .changeGiven(split.changeGiven())
            .cardType(resolveCardType(request))
            .paidByUserId(tenantSupport.requireUserId())
            .build());
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(Instant.now());
        linkedTables.applyStatus(order, TableStatus.CLEANING);
        linkedTables.clearLinks(orderId);
        if (order.getShift() != null) {
            shiftSaleAccumulator.applyPayment(
                order.getShift(),
                payment.getMethod(),
                payment.getAmount(),
                payment.getCashAmount(),
                payment.getCardAmount()
            );
        } else {
            shiftLookup.findOpen(order.getStoreId()).ifPresent(shift ->
                shiftSaleAccumulator.applyPayment(
                    shift,
                    payment.getMethod(),
                    payment.getAmount(),
                    payment.getCashAmount(),
                    payment.getCardAmount()
                )
            );
        }
        revenuePublicationService.publishPaidOrder(order, items, payment);
        recipeConsumePublicationService.publishPaidOrder(order, items, payment);
        LogUtil.info(PayOrderHandler.class, "Order paid: orderId={}, method={}", orderId, request.method());
        return assembler.toResponse(order, items);
    }

    private static com.pos.restaurant.payment.domain.PaymentCardType resolveCardType(PayOrderRequest request) {
        if (request.method() != com.pos.restaurant.payment.domain.PaymentMethod.CARD
            && request.method() != com.pos.restaurant.payment.domain.PaymentMethod.MIXED) {
            return null;
        }
        return request.cardType();
    }
}
