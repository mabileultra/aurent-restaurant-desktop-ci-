package com.pos.pharmacy.revenue.support;

import com.pos.pharmacy.sales.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

public final class PharmacyRefundPayloadFactory {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private PharmacyRefundPayloadFactory() {}

    public static Map<String, Object> build(
        Sale sale,
        UUID returnEventId,
        BigDecimal refundAmount,
        BigDecimal cashAmount,
        BigDecimal cardAmount
    ) {
        if (sale == null || sale.getId() == null || returnEventId == null) {
            return Map.of();
        }
        if (refundAmount == null || refundAmount.signum() <= 0) {
            return Map.of();
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("companyId", sale.getCompanyId());
        payload.put("storeId", sale.getStoreId());
        payload.put("returnEventId", returnEventId);
        payload.put("saleId", sale.getId());
        payload.put("receiptNumber", sale.getReceiptNumber());
        payload.put("refundAmount", refundAmount);
        payload.put("cashAmount", cashAmount != null ? cashAmount : BigDecimal.ZERO);
        payload.put("cardAmount", cardAmount != null ? cardAmount : BigDecimal.ZERO);
        payload.put("paymentMethod", sale.getPaymentMethod() != null ? sale.getPaymentMethod().name() : "CASH");
        payload.put("transactionDate", LocalDate.now(ZONE));
        if (sale.getCashierId() != null) {
            payload.put("createdBy", sale.getCashierId());
        }
        return payload;
    }
}
