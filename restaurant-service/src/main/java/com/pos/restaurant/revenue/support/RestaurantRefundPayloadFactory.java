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
        boolean card = payment.getMethod() == PaymentMethod.CARD;
        BigDecimal amount = payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", order.getCompanyId());
        payload.put("storeId", order.getStoreId());
        payload.put("returnEventId", returnEventId);
        payload.put("saleId", order.getId());
        payload.put("receiptNumber", RestaurantSaleCompletedFactory.receiptNumber(order));
        payload.put("refundAmount", amount);
        payload.put("cashAmount", card ? BigDecimal.ZERO : amount);
        payload.put("cardAmount", card ? amount : BigDecimal.ZERO);
        payload.put("paymentMethod", payment.getMethod().name());
        payload.put(
            "transactionDate",
            LocalDate.ofInstant(order.getClosedAt() != null ? order.getClosedAt() : payment.getPaidAt(), ZONE)
        );
        payload.put("createdBy", payment.getPaidByUserId());
        return payload;
    }
}
