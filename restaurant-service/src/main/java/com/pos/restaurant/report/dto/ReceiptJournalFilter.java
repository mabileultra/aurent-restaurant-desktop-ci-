package com.pos.restaurant.report.dto;

import com.pos.restaurant.order.domain.OrderChannel;
import com.pos.restaurant.payment.domain.PaymentMethod;
import com.pos.restaurant.report.domain.ReceiptStatus;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReceiptJournalFilter(
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
    List<PaymentMethod> methods,
    ReceiptStatus status,
    UUID waiterUserId,
    UUID cashierUserId,
    Integer hallId,
    OrderChannel channel,
    String search
) {
}
