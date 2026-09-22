package com.pos.restaurant.payment.support;

import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.dto.PayOrderRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PaymentSplitPolicy {

    public record Split(
        BigDecimal cashAmount,
        BigDecimal cardAmount,
        BigDecimal amountTendered,
        BigDecimal changeGiven
    ) {}

    public Split resolve(PayOrderRequest request, BigDecimal due) {
        BigDecimal dueScaled = due.setScale(2, RoundingMode.HALF_UP);
        PaymentMethod method = request.method();
        if (method == PaymentMethod.CASH) {
            BigDecimal tendered = nz(request.amountTendered(), dueScaled).setScale(2, RoundingMode.HALF_UP);
            if (tendered.compareTo(dueScaled) < 0) {
                throw new ValidationException("Cash tendered must cover the bill total");
            }
            return new Split(
                dueScaled,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                tendered,
                tendered.subtract(dueScaled).setScale(2, RoundingMode.HALF_UP)
            );
        }
        if (method == PaymentMethod.CARD) {
            return new Split(
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP),
                dueScaled,
                dueScaled,
                BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
            );
        }
        if (method == PaymentMethod.MIXED) {
            BigDecimal cash = nz(request.cashAmount(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal card = nz(request.cardAmount(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            if (cash.compareTo(BigDecimal.ZERO) <= 0 || card.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Mixed payment requires both cash and card amounts");
            }
            if (cash.add(card).compareTo(dueScaled) != 0) {
                throw new BusinessException("Cash + card must equal the bill total");
            }
            BigDecimal tendered = nz(request.amountTendered(), cash).setScale(2, RoundingMode.HALF_UP);
            if (tendered.compareTo(cash) < 0) {
                tendered = cash;
            }
            return new Split(
                cash,
                card,
                tendered,
                tendered.subtract(cash).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)
            );
        }
        throw new ValidationException("Unsupported payment method");
    }

    private static BigDecimal nz(BigDecimal value, BigDecimal fallback) {
        return value == null ? fallback : value;
    }
}
