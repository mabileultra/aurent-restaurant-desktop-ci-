package com.pos.pharmacy.revenue.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.pharmacy.revenue.config.PharmacyKafkaProperties;
import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import com.pos.pharmacy.revenue.repository.RevenueOutboxRepository;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.kafka.KafkaTopics;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueOutboxServiceImplTest {

    @Mock
    private RevenueOutboxRepository outboxRepository;
    @Mock
    private PharmacyKafkaProperties kafkaProperties;
    @Mock
    private ObjectProvider<KafkaTemplate<String, Object>> domainKafka;
    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock
    private ObjectMapper objectMapper;

    @Test
    void marksSentWhenKafkaFutureCompletes() throws Exception {
        RevenueOutboxServiceImpl service = new RevenueOutboxServiceImpl(
            outboxRepository, kafkaProperties, domainKafka, objectMapper
        );
        UUID id = UUID.randomUUID();
        RevenueOutbox row = pendingRow(id);

        when(outboxRepository.findById(id)).thenReturn(Optional.of(row));
        when(kafkaProperties.isEnabled()).thenReturn(true);
        when(kafkaProperties.getSendTimeoutMs()).thenReturn(1000L);
        when(domainKafka.getIfAvailable()).thenReturn(kafkaTemplate);
        when(objectMapper.readValue("{}", SaleCompletedEvent.class)).thenReturn(mock(SaleCompletedEvent.class));
        when(kafkaTemplate.send(eq(KafkaTopics.SALES_COMPLETED), eq("sale-1"), any()))
            .thenReturn(CompletableFuture.completedFuture(new SendResult<>(null, null)));

        service.trySend(id);

        ArgumentCaptor<RevenueOutbox> captor = ArgumentCaptor.forClass(RevenueOutbox.class);
        verify(outboxRepository).save(captor.capture());
        assertEquals("SENT", captor.getValue().getStatus());
    }

    @Test
    void marksFailedWhenKafkaFutureFails() throws Exception {
        RevenueOutboxServiceImpl service = new RevenueOutboxServiceImpl(
            outboxRepository, kafkaProperties, domainKafka, objectMapper
        );
        UUID id = UUID.randomUUID();
        RevenueOutbox row = pendingRow(id);

        when(outboxRepository.findById(id)).thenReturn(Optional.of(row));
        when(kafkaProperties.isEnabled()).thenReturn(true);
        when(kafkaProperties.getSendTimeoutMs()).thenReturn(1000L);
        when(domainKafka.getIfAvailable()).thenReturn(kafkaTemplate);
        when(objectMapper.readValue("{}", SaleCompletedEvent.class)).thenReturn(mock(SaleCompletedEvent.class));
        when(kafkaTemplate.send(eq(KafkaTopics.SALES_COMPLETED), eq("sale-1"), any()))
            .thenReturn(CompletableFuture.failedFuture(new RuntimeException("broker down")));

        service.trySend(id);

        ArgumentCaptor<RevenueOutbox> captor = ArgumentCaptor.forClass(RevenueOutbox.class);
        verify(outboxRepository).save(captor.capture());
        assertEquals("FAILED", captor.getValue().getStatus());
        assertEquals(1, captor.getValue().getAttempts());
    }

    private static RevenueOutbox pendingRow(UUID id) {
        return RevenueOutbox.builder()
            .id(id)
            .channel(RevenueOutboxChannel.SALE_COMPLETED)
            .topic(KafkaTopics.SALES_COMPLETED)
            .messageKey("sale-1")
            .idempotencyKey("key-1")
            .payload("{}")
            .status("PENDING")
            .attempts(0)
            .build();
    }
}
