package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.payment.support.OrderPaymentResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class GetOrderPaymentHandler {

    private final OrderLookup orderLookup;
    private final FloorOrderPaymentRepository paymentRepository;
    private final OrderPaymentResponseMapper responseMapper;

    @Transactional(readOnly = true)
    public OrderPaymentResponse handle(UUID orderId) {
        orderLookup.require(orderId);
        FloorOrderPayment payment = paymentRepository.findFirstByOrder_IdOrderByPaidAtDesc(orderId)
            .orElseThrow(() -> new BusinessException("У заказа нет платежа"));
        return responseMapper.toResponse(orderId, payment);
    }
}
