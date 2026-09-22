package com.pos.restaurant.shift.support;

import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.shift.entity.RestaurantShift;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ShiftSaleAccumulator {

    public void applyPayment(
        RestaurantShift shift,
        PaymentMethod method,
        BigDecimal amount,
        BigDecimal cashAmount,
        BigDecimal cardAmount
    ) {
        if (shift == null || amount == null || amount.signum() <= 0) {
            return;
        }
        shift.setSaleCount(shift.getSaleCount() + 1);
        shift.setTotalAmount(shift.getTotalAmount().add(amount));
        if (method == PaymentMethod.MIXED) {
            BigDecimal cash = cashAmount == null ? BigDecimal.ZERO : cashAmount;
            BigDecimal card = cardAmount == null ? BigDecimal.ZERO : cardAmount;
            if (cash.signum() > 0) {
                shift.setCashAmount(shift.getCashAmount().add(cash));
            }
            if (card.signum() > 0) {
                shift.setCardAmount(shift.getCardAmount().add(card));
            }
            return;
        }
        if (method == PaymentMethod.CASH) {
            shift.setCashAmount(shift.getCashAmount().add(amount));
        } else {
            shift.setCardAmount(shift.getCardAmount().add(amount));
        }
    }

    public void applyRefund(
        RestaurantShift shift,
        PaymentMethod method,
        BigDecimal amount,
        BigDecimal cashAmount,
        BigDecimal cardAmount
    ) {
        if (shift == null || amount == null || amount.signum() <= 0) {
            return;
        }
        BigDecimal nextTotal = shift.getTotalAmount().subtract(amount);
        shift.setTotalAmount(nextTotal.signum() < 0 ? BigDecimal.ZERO : nextTotal);
        if (method == PaymentMethod.MIXED) {
            BigDecimal cash = cashAmount == null ? BigDecimal.ZERO : cashAmount;
            BigDecimal card = cardAmount == null ? BigDecimal.ZERO : cardAmount;
            if (cash.signum() > 0) {
                BigDecimal nextCash = shift.getCashAmount().subtract(cash);
                shift.setCashAmount(nextCash.signum() < 0 ? BigDecimal.ZERO : nextCash);
            }
            if (card.signum() > 0) {
                BigDecimal nextCard = shift.getCardAmount().subtract(card);
                shift.setCardAmount(nextCard.signum() < 0 ? BigDecimal.ZERO : nextCard);
            }
            return;
        }
        if (method == PaymentMethod.CASH) {
            BigDecimal nextCash = shift.getCashAmount().subtract(amount);
            shift.setCashAmount(nextCash.signum() < 0 ? BigDecimal.ZERO : nextCash);
        } else {
            BigDecimal nextCard = shift.getCardAmount().subtract(amount);
            shift.setCardAmount(nextCard.signum() < 0 ? BigDecimal.ZERO : nextCard);
        }
    }
}
