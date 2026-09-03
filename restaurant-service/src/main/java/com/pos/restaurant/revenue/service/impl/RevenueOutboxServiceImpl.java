package com.pos.restaurant.revenue.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.recipe.dto.IngredientConsumeRequest;
import com.pos.restaurant.revenue.config.RestaurantKafkaProperties;
import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.repository.RevenueOutboxRepository;
import com.pos.restaurant.revenue.service.PosInventoryClient;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
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

@Service
@RequiredArgsConstructor
public class RevenueOutboxServiceImpl implements RevenueOutboxService {

    private static final List<String> RETRY_STATUSES = List.of("PENDING", "FAILED");

    private final RevenueOutboxRepository outboxRepository;
    private final RestaurantKafkaProperties kafkaProperties;
    private final ObjectProvider<KafkaTemplate<String, Object>> domainKafka;
    private final ObjectProvider<KafkaTemplate<String, FinanceIntegrationMessage>> financeKafka;
    private final ObjectMapper objectMapper;
    private final PosInventoryClient posInventoryClient;

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
        if (row.getChannel() != RevenueOutboxChannel.STOCK_CONSUME && !kafkaProperties.isEnabled()) {
            return;
        }
        boolean ok = switch (row.getChannel()) {
            case SALE_COMPLETED -> publishSaleCompleted(row);
            case FINANCE_INCOME -> publishFinanceIncome(row);
            case STOCK_CONSUME -> publishStockConsume(row);
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
            template.send(KafkaTopics.SALES_COMPLETED, row.getMessageKey(), event)
                .get(kafkaProperties.getSendTimeoutMs(), java.util.concurrent.TimeUnit.MILLISECONDS);
            return true;
        } catch (Exception ex) {
            LogUtil.warn(RevenueOutboxServiceImpl.class, "Sale completed publish failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean publishFinanceIncome(RevenueOutbox row) {
        KafkaTemplate<String, FinanceIntegrationMessage> template = financeKafka.getIfAvailable();
        if (template == null) {
            return false;
        }
        try {
            FinanceIntegrationMessage message = new FinanceIntegrationMessage(
                row.getId(),
                "SALE_INCOME",
                "/internal/finance/incomes/from-sale",
                row.getIdempotencyKey(),
                row.getPayload()
            );
            template.send(KafkaTopics.FINANCE_INTEGRATION, row.getMessageKey(), message)
                .get(kafkaProperties.getSendTimeoutMs(), java.util.concurrent.TimeUnit.MILLISECONDS);
            return true;
        } catch (Exception ex) {
            LogUtil.warn(RevenueOutboxServiceImpl.class, "Finance income publish failed: {}", ex.getMessage());
            return false;
        }
    }

    private boolean publishStockConsume(RevenueOutbox row) {
        try {
            IngredientConsumeRequest request = objectMapper.readValue(row.getPayload(), IngredientConsumeRequest.class);
            return posInventoryClient.consumeIngredients(request);
        } catch (Exception ex) {
            LogUtil.warn(RevenueOutboxServiceImpl.class, "Stock consume publish failed: {}", ex.getMessage());
            return false;
        }
    }

    private static long retryDelaySeconds(int attempts) {
        long delay = 30L * (1L << Math.min(attempts - 1, 4));
        return Math.min(delay, 300L);
    }
}
