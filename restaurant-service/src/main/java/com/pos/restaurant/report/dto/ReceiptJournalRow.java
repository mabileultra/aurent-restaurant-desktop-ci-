package com.pos.restaurant.report.dto;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.payment.domain.PaymentCardType;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.report.domain.ReceiptStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ReceiptJournalRow(
    UUID orderId,
    int orderNo,
    Instant paidAt,
    OrderChannel channel,
    String hallName,
    String tableCode,
    int guestCount,
    UUID waiterUserId,
    UUID cashierUserId,
    PaymentMethod method,
    PaymentCardType cardType,
    BigDecimal discountAmount,
    BigDecimal serviceAmount,
    BigDecimal totalAmount,
    BigDecimal cashAmount,
    BigDecimal cardAmount,
    BigDecimal refundAmount,
    BigDecimal netAmount,
    ReceiptStatus status,
    String clientName,
    String debtPhone,
    String debtComment,
    BigDecimal advancePaid,
    BigDecimal debtRemaining
) {
}
