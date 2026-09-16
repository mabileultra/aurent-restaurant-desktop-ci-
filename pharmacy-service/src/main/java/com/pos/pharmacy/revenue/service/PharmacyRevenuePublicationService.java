package com.pos.pharmacy.revenue.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import com.pos.pharmacy.revenue.support.PharmacySaleCompletedFactory;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.kafka.KafkaTopics;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PharmacyRevenuePublicationService {

    private final RevenueOutboxService outboxService;
    private final ObjectMapper objectMapper;

    public void onSaleCompleted(Sale sale, Map<UUID, Map<String, String>> attributesByProductId, String storeName) {
        if (sale == null || sale.getId() == null) {
            return;
        }
        SaleCompletedEvent event = PharmacySaleCompletedFactory.from(sale, attributesByProductId, storeName);
        String idempotencyKey = "pharmacy-sale:" + sale.getId() + ":"
            + (sale.getStatus() != null ? sale.getStatus().name() : "COMPLETED");
        RevenueOutbox row = outboxService.enqueue(
            RevenueOutboxChannel.SALE_COMPLETED,
            KafkaTopics.SALES_COMPLETED,
            sale.getId().toString(),
            idempotencyKey,
            writeJson(event)
        );
        scheduleSend(row.getId());
    }

    private void scheduleSend(UUID outboxId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            outboxService.trySend(outboxId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                outboxService.trySend(outboxId);
            }
        });
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Revenue payload serialization failed", ex);
        }
    }
}
