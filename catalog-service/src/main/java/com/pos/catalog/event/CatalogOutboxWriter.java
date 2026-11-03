package com.pos.catalog.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.catalog.entity.CatalogOutbox;
import com.pos.catalog.entity.Product;
import com.pos.catalog.exception.CatalogExceptions;
import com.pos.catalog.repository.CatalogOutboxRepository;
import com.pos.shared.event.ProductSnapshotEvent;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CatalogOutboxWriter {

    private final CatalogOutboxRepository outboxRepository;
    private final ProductSnapshotMapper snapshotMapper;
    private final ObjectMapper objectMapper;

    public void enqueueProductSnapshot(Product product) {
        ProductSnapshotEvent event = snapshotMapper.toEvent(product);
        if (event == null) {
            return;
        }
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException ex) {
            LogUtil.error(CatalogOutboxWriter.class, "Failed to serialize ProductSnapshotEvent", ex);
            throw CatalogExceptions.badRequest("Не удалось сериализовать событие каталога");
        }
        String idempotencyKey = event.productId() + ":" + event.updatedAt().toEpochMilli() + ":" + UUID.randomUUID();
        outboxRepository.save(CatalogOutbox.builder()
            .eventType(CatalogEventTypes.PRODUCT_SNAPSHOT)
            .aggregateId(event.productId())
            .companyId(event.companyId())
            .idempotencyKey(idempotencyKey)
            .payload(payload)
            .status("PENDING")
            .attempts(0)
            .build());
    }
}
