package com.pos.pharmacy.revenue.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import com.pos.pharmacy.revenue.support.PharmacyRefundPayloadFactory;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyRefundPublicationService {

    private final RevenueOutboxService outboxService;
    private final RevenueOutboxDispatchService outboxDispatchService;
    private final ObjectMapper objectMapper;

    public void onRefund(
        Sale sale,
        UUID returnEventId,
        BigDecimal refundAmount,
        BigDecimal cashRefund,
        BigDecimal cardRefund
    ) {
        Map<String, Object> payload = PharmacyRefundPayloadFactory.build(
            sale, returnEventId, refundAmount, cashRefund, cardRefund
        );
        if (payload.isEmpty()) {
            return;
        }
        RevenueOutbox row = outboxService.enqueue(
            RevenueOutboxChannel.REFUND_EXPENSE,
            KafkaTopics.FINANCE_INTEGRATION,
            "pharmacy-refund:" + returnEventId,
            "pharmacy-refund:" + returnEventId,
            writeJson(payload)
        );
        outboxDispatchService.dispatchAfterCommit(row.getId());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Refund payload serialization failed", ex);
        }
    }
}
