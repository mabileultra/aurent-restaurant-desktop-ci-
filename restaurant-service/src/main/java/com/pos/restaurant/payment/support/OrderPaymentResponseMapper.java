package com.pos.restaurant.payment.support;

import com.pos.restaurant.payment.dto.OrderPaymentResponse;
import com.pos.restaurant.payment.entity.FloorOrderPayment;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OrderPaymentResponseMapper {

    public OrderPaymentResponse toResponse(UUID orderId, FloorOrderPayment payment) {
        return new OrderPaymentResponse(
            payment.getId(),
            orderId,
            payment.getMethod(),
            payment.getAmount(),
            payment.getCashAmount(),
            payment.getCardAmount(),
            payment.getAmountTendered(),
            payment.getChangeGiven(),
            payment.getCardType(),
            payment.getPaidAt(),
            payment.getFiscalStatus(),
            payment.getFiscalSign(),
            payment.getFiscalReceiptSeq(),
            payment.getMultikassaSaleId(),
            payment.getFiscalTerminalId(),
            payment.getFiscalizedAt()
        );
    }
}
