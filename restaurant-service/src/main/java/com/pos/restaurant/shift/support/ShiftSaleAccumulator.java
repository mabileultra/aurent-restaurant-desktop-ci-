package com.pos.restaurant.shift.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ShiftSaleAccumulator {

    public void applyPayment(RestaurantShift shift, PaymentMethod method, BigDecimal amount) {
        shift.setSaleCount(shift.getSaleCount() + 1);
        shift.setTotalAmount(shift.getTotalAmount().add(amount));
        if (method == PaymentMethod.CASH) {
            shift.setCashAmount(shift.getCashAmount().add(amount));
        } else {
            shift.setCardAmount(shift.getCardAmount().add(amount));
        }
    }
}
