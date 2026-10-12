package com.pos.restaurant.revenue.support;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class RestaurantRefundPayloadFactory {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private RestaurantRefundPayloadFactory() {}

    public static Map<String, Object> fromPaidOrder(FloorOrder order, FloorOrderPayment payment, UUID returnEventId) {
        BigDecimal amount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        return fromPaidOrder(order, payment, returnEventId, amount);
    }

    public static Map<String, Object> fromPaidOrder(
        FloorOrder order,
        FloorOrderPayment payment,
        UUID returnEventId,
        BigDecimal refundAmount
    ) {
        BigDecimal amount = refundAmount != null ? refundAmount : BigDecimal.ZERO;
        BigDecimal cash;
        BigDecimal card;
        if (payment.getMethod() == PaymentMethod.MIXED) {
            BigDecimal cashPaid = payment.getCashAmount() != null ? payment.getCashAmount() : BigDecimal.ZERO;
            BigDecimal cardPaid = payment.getCardAmount() != null ? payment.getCardAmount() : BigDecimal.ZERO;
            BigDecimal paid = cashPaid.add(cardPaid);
            if (paid.signum() <= 0) {
                cash = amount;
                card = BigDecimal.ZERO;
            } else {
                cash = amount.multiply(cashPaid).divide(paid, 2, java.math.RoundingMode.HALF_UP);
                card = amount.subtract(cash).max(BigDecimal.ZERO);
            }
        } else if (payment.getMethod() == PaymentMethod.CARD
            || payment.getMethod() == PaymentMethod.CASHLESS) {
            cash = BigDecimal.ZERO;
            card = amount;
        } else {
            cash = amount;
            card = BigDecimal.ZERO;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", order.getCompanyId());
        payload.put("storeId", order.getStoreId());
        payload.put("returnEventId", returnEventId);
        payload.put("saleId", order.getId());
        payload.put("receiptNumber", RestaurantSaleCompletedFactory.receiptNumber(order));
        payload.put("refundAmount", amount);
        payload.put("cashAmount", cash);
        payload.put("cardAmount", card);
        payload.put("paymentMethod", payment.getMethod().name());
        payload.put(
            "transactionDate",
            LocalDate.ofInstant(order.getClosedAt() != null ? order.getClosedAt() : payment.getPaidAt(), ZONE)
        );
        payload.put("createdBy", payment.getPaidByUserId());
        return payload;
    }
}
