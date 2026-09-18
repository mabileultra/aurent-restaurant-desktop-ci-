package com.pos.pharmacy.revenue.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.pharmacy.revenue.config.PharmacyKafkaProperties;
import com.pos.pharmacy.revenue.domain.RevenueOutboxChannel;
import com.pos.pharmacy.revenue.entity.RevenueOutbox;
import com.pos.pharmacy.revenue.repository.RevenueOutboxRepository;
import com.pos.pharmacy.revenue.service.RevenueOutboxService;
import com.pos.shared.event.SaleCompletedEvent;
import com.pos.shared.kafka.FinanceIntegrationMessage;
import com.pos.shared.kafka.KafkaTopics;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
public class RevenueOutboxServiceImpl implements RevenueOutboxService {

    private static final List<String> RETRY_STATUSES = List.of("PENDING", "FAILED");

    private final RevenueOutboxRepository outboxRepository;
    private final PharmacyKafkaProperties kafkaProperties;
    private final ObjectProvider<KafkaTemplate<String, Object>> domainKafka;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public RevenueOutbox enqueue(
        RevenueOutboxChannel channel,
        String topic,
        String messageKey,
        String idempotencyKey,
        String payload
    ) {
        return outboxRepository.findByIdempotencyKey(idempotencyKey)
            .orElseGet(() -> outboxRepository.save(RevenueOutbox.builder()
                .channel(channel)
                .topic(topic)
                .messageKey(messageKey)
                .idempotencyKey(idempotencyKey)
                .payload(payload)
                .status("PENDING")
                .attempts(0)
                .build()));
    }

    @Override
    @Transactional
    public void trySend(UUID outboxId) {
        outboxRepository.findById(outboxId).ifPresent(this::sendOne);
    }

    @Override
    @Transactional
    public int processPendingBatch() {
        List<RevenueOutbox> rows = outboxRepository.findReadyForRetry(
            RETRY_STATUSES,
            Instant.now(),
            PageRequest.of(0, 50)
        );
        for (RevenueOutbox row : rows) {
            sendOne(row);
        }
        return rows.size();
    }

    private void sendOne(RevenueOutbox row) {
        if ("SENT".equals(row.getStatus())) {
            return;
        }
        if (!kafkaProperties.isEnabled()) {
            return;
        }
        boolean ok = switch (row.getChannel()) {
            case SALE_COMPLETED -> publishSaleCompleted(row);
            case REFUND_EXPENSE -> publishRefundExpense(row);
        };
        if (ok) {
            row.setStatus("SENT");
            row.setLastError(null);
            row.setNextRetryAt(null);
            outboxRepository.save(row);
            LogUtil.info(RevenueOutboxServiceImpl.class, "Revenue event sent: key={}", row.getIdempotencyKey());
            return;
        }
        int attempts = row.getAttempts() + 1;
        row.setAttempts(attempts);
        row.setStatus("FAILED");
        row.setLastError("Kafka publish failed");
        row.setNextRetryAt(Instant.now().plusSeconds(retryDelaySeconds(attempts)));
        outboxRepository.save(row);
        LogUtil.warn(
            RevenueOutboxServiceImpl.class,
            "Revenue event retry scheduled: key={}, attempts={}",
            row.getIdempotencyKey(),
            attempts
        );
    }

    private boolean publishSaleCompleted(RevenueOutbox row) {
        KafkaTemplate<String, Object> template = domainKafka.getIfAvailable();
        if (template == null) {
            return false;
        }
        try {
            SaleCompletedEvent event = objectMapper.readValue(row.getPayload(), SaleCompletedEvent.class);
            return awaitSend(template.send(KafkaTopics.SALES_COMPLETED, row.getMessageKey(), event));
        } catch (Exception ex) {
            LogUtil.warn(RevenueOutboxServiceImpl.class, "Sale completed publish failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean publishRefundExpense(RevenueOutbox row) {
        KafkaTemplate<String, Object> template = domainKafka.getIfAvailable();
        if (template == null) {
            return false;
        }
        try {
            FinanceIntegrationMessage message = new FinanceIntegrationMessage(
                row.getId(),
                "REFUND_EXPENSE",
                "/internal/finance/expenses/from-refund",
                row.getIdempotencyKey(),
                row.getPayload()
            );
            return awaitSend(template.send(KafkaTopics.FINANCE_INTEGRATION, row.getMessageKey(), message));
        } catch (Exception ex) {
            LogUtil.warn(RevenueOutboxServiceImpl.class, "Refund expense publish failed: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Ждёт результат только на async/retry воркере — поток кассы сюда не попадает.
     * Без blocking {@code Future.get}: timeout через {@code orTimeout}.
     */
    private boolean awaitSend(CompletableFuture<?> sendFuture) {
        try {
            sendFuture
                .orTimeout(kafkaProperties.getSendTimeoutMs(), TimeUnit.MILLISECONDS)
                .join();
            return true;
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof TimeoutException) {
                LogUtil.warn(RevenueOutboxServiceImpl.class, "Kafka send timed out after {}ms", kafkaProperties.getSendTimeoutMs());
            } else {
                LogUtil.warn(RevenueOutboxServiceImpl.class, "Kafka send failed: {}", cause.getMessage());
            }
            return false;
        }
    }

    private static long retryDelaySeconds(int attempts) {
        long delay = 30L * (1L << Math.min(attempts - 1, 4));
        return Math.min(delay, 300L);
    }
}
