package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class GetOrderPaymentHandler {

    private final OrderLookup orderLookup;
    private final FloorOrderPaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public OrderPaymentResponse handle(UUID orderId) {
        orderLookup.require(orderId);
        FloorOrderPayment payment = paymentRepository.findFirstByOrder_IdOrderByPaidAtDesc(orderId)
            .orElseThrow(() -> new BusinessException("У заказа нет платежа"));
        return new OrderPaymentResponse(
            payment.getId(),
            orderId,
            payment.getMethod(),
            payment.getAmount(),
            payment.getCashAmount(),
            payment.getCardAmount(),
            payment.getAmountTendered(),
            payment.getChangeGiven(),
            payment.getPaidAt()
        );
    }
}
