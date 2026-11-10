package com.pos.restaurant.payment.service.impl;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.order.support.OrderLookup;
import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.dto.PaymentFiscalPayload;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import com.pos.restaurant.payment.repository.FloorOrderPaymentRepository;
import com.pos.restaurant.payment.support.OrderPaymentResponseMapper;
import com.pos.restaurant.payment.support.PaymentFiscalApplier;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttachPaymentFiscalHandler {

    private final OrderLookup orderLookup;
    private final FloorOrderPaymentRepository paymentRepository;
    private final PaymentFiscalApplier fiscalApplier;
    private final OrderPaymentResponseMapper responseMapper;

    @Transactional
    public OrderPaymentResponse handle(UUID orderId, PaymentFiscalPayload payload) {
        orderLookup.require(orderId);
        FloorOrderPayment payment = paymentRepository.findFirstByOrder_IdOrderByPaidAtDesc(orderId)
            .orElseThrow(() -> new BusinessException("У заказа нет платежа"));
        fiscalApplier.apply(payment, payload);
        paymentRepository.save(payment);
        LogUtil.info(
            AttachPaymentFiscalHandler.class,
            "Payment fiscal attached: orderId={}, status={}",
            orderId,
            payment.getFiscalStatus()
        );
        return responseMapper.toResponse(orderId, payment);
    }
}
