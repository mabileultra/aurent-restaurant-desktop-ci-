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
        BigDecimal cash = resolveCash(payment);
        BigDecimal card = resolveCard(payment);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", order.getCompanyId());
        payload.put("storeId", order.getStoreId());
        payload.put("saleId", order.getId());
        payload.put("receiptNumber", RestaurantSaleCompletedFactory.receiptNumber(order));
        payload.put("totalAmount", total);
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

    private static BigDecimal resolveCash(FloorOrderPayment payment) {
        if (payment.getCashAmount() != null && payment.getCashAmount().signum() > 0) {
            return payment.getCashAmount();
        }
        if (payment.getMethod() == PaymentMethod.CARD
            || payment.getMethod() == PaymentMethod.CASHLESS
            || payment.getMethod() == PaymentMethod.MIXED) {
            return BigDecimal.ZERO;
        }
        return payment.getAmount();
    }

    private static BigDecimal resolveCard(FloorOrderPayment payment) {
        if (payment.getCardAmount() != null && payment.getCardAmount().signum() > 0) {
            return payment.getCardAmount();
        }
        if (payment.getMethod() == PaymentMethod.CARD || payment.getMethod() == PaymentMethod.CASHLESS) {
            return payment.getAmount();
        }
        return BigDecimal.ZERO;
    }
}
