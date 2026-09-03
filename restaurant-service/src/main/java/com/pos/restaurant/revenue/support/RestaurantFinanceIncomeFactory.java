package com.pos.restaurant.revenue.support;

import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.payment.entity.FloorOrderPayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

public final class RestaurantFinanceIncomeFactory {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private RestaurantFinanceIncomeFactory() {
    }

    public static Map<String, Object> fromPaidOrder(FloorOrder order, FloorOrderPayment payment, BigDecimal total) {
        boolean card = payment.getMethod() == PaymentMethod.CARD;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", order.getCompanyId());
        payload.put("storeId", order.getStoreId());
        payload.put("saleId", order.getId());
        payload.put("receiptNumber", RestaurantSaleCompletedFactory.receiptNumber(order));
        payload.put("totalAmount", total);
        payload.put("cashAmount", card ? BigDecimal.ZERO : payment.getAmount());
        payload.put("cardAmount", card ? payment.getAmount() : BigDecimal.ZERO);
        payload.put("paymentMethod", payment.getMethod().name());
        payload.put(
            "transactionDate",
            LocalDate.ofInstant(order.getClosedAt() != null ? order.getClosedAt() : payment.getPaidAt(), ZONE)
        );
        payload.put("createdBy", payment.getPaidByUserId());
        return payload;
    }
}
