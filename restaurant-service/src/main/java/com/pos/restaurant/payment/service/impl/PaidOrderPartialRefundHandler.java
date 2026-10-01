package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.domain.TableStatus;
import com.pos.restaurant.order.domain.OrderItemStatus;
import com.pos.restaurant.order.domain.OrderStatus;
import com.pos.restaurant.order.dto.OrderResponse;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.order.entity.FloorOrderItem;
import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.order.support.OrderResponseAssembler;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PartialRefundLineRequest;
import com.pos.restaurant.payment.dto.PartialRefundRequest;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.recipe.service.RecipeStockRestoreService;
import com.pos.restaurant.revenue.service.RestaurantRefundPublicationService;
import com.pos.restaurant.shift.support.ShiftSaleAccumulator;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaidOrderPartialRefundHandler {

    private final FloorOrderItemRepository itemRepository;
    private final FloorOrderPaymentRepository paymentRepository;
    private final OrderLookup orderLookup;
    private final OrderResponseAssembler assembler;
    private final ShiftSaleAccumulator shiftSaleAccumulator;
    private final RestaurantRefundPublicationService refundPublicationService;
    private final RecipeStockRestoreService recipeStockRestoreService;

    @Transactional
    public OrderResponse handle(UUID orderId, PartialRefundRequest request) {
        FloorOrder order = orderLookup.requireClosed(orderId);
        FloorOrderPayment payment = paymentRepository.findFirstByOrder_IdOrderByPaidAtDesc(orderId)
            .orElseThrow(() -> new BusinessException("У оплаченного заказа нет платежа"));
        List<FloorOrderItem> items = itemRepository.findByOrderIdOrderBySortOrderAscCreatedAtAsc(orderId);
        Map<UUID, FloorOrderItem> byId = new HashMap<>();
        items.forEach(item -> byId.put(item.getId(), item));

        BigDecimal remainingDishesBefore = remainingDishTotal(items);
        BigDecimal refundDishes = BigDecimal.ZERO;
        List<FloorOrderItem> restoreSlice = new ArrayList<>();
        boolean any = false;

        for (PartialRefundLineRequest line : request.lines()) {
            FloorOrderItem item = byId.get(line.orderItemId());
            if (item == null) {
                throw new BusinessException("Позиция заказа не найдена: " + line.orderItemId());
            }
            if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
                throw new BusinessException("Нельзя вернуть отменённую позицию: " + item.getName());
            }
            BigDecimal returnQty = line.quantity().setScale(3, RoundingMode.HALF_UP);
            if (returnQty.signum() <= 0) {
                continue;
            }
            BigDecimal returned = item.getReturnedQuantity() == null ? BigDecimal.ZERO : item.getReturnedQuantity();
            BigDecimal remaining = item.getQuantity().subtract(returned);
            if (returnQty.compareTo(remaining) > 0) {
                throw new BusinessException("Нельзя вернуть больше, чем осталось: " + item.getName());
            }
            item.setReturnedQuantity(returned.add(returnQty));
            refundDishes = refundDishes.add(lineAmount(item.getUnitPrice(), returnQty));
            restoreSlice.add(sliceForRestore(item, returnQty));
            any = true;
        }

        if (!any) {
            throw new BusinessException("Укажите количество для возврата");
        }

        BigDecimal commissionBefore = order.getCommissionAmount() == null
            ? BigDecimal.ZERO
            : order.getCommissionAmount();
        BigDecimal refundCommission = BigDecimal.ZERO;
        if (commissionBefore.signum() > 0 && remainingDishesBefore.signum() > 0) {
            refundCommission = commissionBefore
                .multiply(refundDishes)
                .divide(remainingDishesBefore, 2, RoundingMode.HALF_UP);
            if (refundCommission.compareTo(commissionBefore) > 0) {
                refundCommission = commissionBefore;
            }
        }
        order.setCommissionAmount(commissionBefore.subtract(refundCommission).max(BigDecimal.ZERO));

        BigDecimal totalRefund = refundDishes.add(refundCommission).setScale(2, RoundingMode.HALF_UP);
        CashCardSplit split = splitRefund(payment, totalRefund);
        if (order.getShift() != null) {
            shiftSaleAccumulator.applyRefund(
                order.getShift(),
                payment.getMethod(),
                totalRefund,
                split.cash(),
                split.card()
            );
        }

        boolean fullyReturned = items.stream().allMatch(this::isFullyReturned);
        if (fullyReturned) {
            order.setStatus(OrderStatus.REFUNDED);
            order.setCommissionAmount(BigDecimal.ZERO);
            if (order.getTable() != null && order.getTable().getStatus() == TableStatus.CLEANING) {
                order.getTable().setStatus(TableStatus.FREE);
            }
        }

        String eventKey = UUID.randomUUID().toString();
        refundPublicationService.publishPartial(order, restoreSlice, payment, totalRefund, eventKey);
        recipeStockRestoreService.restorePaidItems(order, restoreSlice, payment, eventKey);

        LogUtil.info(
            PaidOrderPartialRefundHandler.class,
            "Partial refund: orderId={}, amount={}, full={}",
            orderId,
            totalRefund,
            fullyReturned
        );
        return assembler.toResponse(order, items);
    }

    private boolean isFullyReturned(FloorOrderItem item) {
        if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
            return true;
        }
        BigDecimal returned = item.getReturnedQuantity() == null ? BigDecimal.ZERO : item.getReturnedQuantity();
        return returned.compareTo(item.getQuantity()) >= 0;
    }

    private BigDecimal remainingDishTotal(List<FloorOrderItem> items) {
        BigDecimal sum = BigDecimal.ZERO;
        for (FloorOrderItem item : items) {
            if (item.getItemStatus() == OrderItemStatus.CANCELLED) {
                continue;
            }
            BigDecimal returned = item.getReturnedQuantity() == null ? BigDecimal.ZERO : item.getReturnedQuantity();
            BigDecimal remaining = item.getQuantity().subtract(returned);
            if (remaining.signum() > 0) {
                sum = sum.add(lineAmount(item.getUnitPrice(), remaining));
            }
        }
        return sum;
    }

    private BigDecimal lineAmount(BigDecimal unitPrice, BigDecimal qty) {
        return unitPrice.multiply(qty).setScale(2, RoundingMode.HALF_UP);
    }

    private FloorOrderItem sliceForRestore(FloorOrderItem source, BigDecimal qty) {
        return FloorOrderItem.builder()
            .id(source.getId())
            .order(source.getOrder())
            .menuItem(source.getMenuItem())
            .name(source.getName())
            .quantity(qty)
            .returnedQuantity(BigDecimal.ZERO)
            .unitPrice(source.getUnitPrice())
            .stationId(source.getStationId())
            .note(source.getNote())
            .itemStatus(source.getItemStatus())
            .sortOrder(source.getSortOrder())
            .build();
    }

    private CashCardSplit splitRefund(FloorOrderPayment payment, BigDecimal totalRefund) {
        PaymentMethod method = payment.getMethod();
        if (method == PaymentMethod.MIXED) {
            BigDecimal cashPaid = payment.getCashAmount() == null ? BigDecimal.ZERO : payment.getCashAmount();
            BigDecimal cardPaid = payment.getCardAmount() == null ? BigDecimal.ZERO : payment.getCardAmount();
            BigDecimal paid = cashPaid.add(cardPaid);
            if (paid.signum() <= 0) {
                return new CashCardSplit(totalRefund, BigDecimal.ZERO);
            }
            BigDecimal cash = totalRefund.multiply(cashPaid).divide(paid, 2, RoundingMode.HALF_UP);
            BigDecimal card = totalRefund.subtract(cash).max(BigDecimal.ZERO);
            return new CashCardSplit(cash, card);
        }
        if (method == PaymentMethod.CARD
            || method == PaymentMethod.CREDIT
            || method == PaymentMethod.ADVANCE) {
            return new CashCardSplit(BigDecimal.ZERO, totalRefund);
        }
        return new CashCardSplit(totalRefund, BigDecimal.ZERO);
    }

    private record CashCardSplit(BigDecimal cash, BigDecimal card) {}
}
