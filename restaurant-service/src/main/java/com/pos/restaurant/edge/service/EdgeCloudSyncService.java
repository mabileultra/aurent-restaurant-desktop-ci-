package com.pos.restaurant.edge.service;

import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.repository.RevenueOutboxRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Pushes PENDING/FAILED non-stock outbox rows to cloud {@code POST /rst/edge/sync/ingest}.
 * Phase I: mark failures with backoff; status counts only cloud-bound channels.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCloudSyncService {

    private static final List<String> RETRY = List.of("PENDING", "FAILED");
    private static final int BATCH = 100;
    private static final List<RevenueOutboxChannel> STOCK_CHANNELS = List.of(
        RevenueOutboxChannel.STOCK_CONSUME,
        RevenueOutboxChannel.STOCK_RESTORE
    );

    private final RevenueOutboxRepository outboxRepository;

    @Value("${app.restaurant.edge.cloud-sync-url:}")
    private String cloudSyncUrl;

    @Value("${app.restaurant.edge.cloud-sync-token:}")
    private String cloudSyncToken;

    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        long pending = countCloudBound("PENDING");
        long failed = countCloudBound("FAILED");
        Map<String, Object> m = new HashMap<>();
        m.put("pending", pending);
        m.put("failed", failed);
        m.put("cloudConfigured", StringUtils.hasText(cloudSyncUrl));
        return m;
    }

    @Transactional
    public Map<String, Object> pushPendingBatch() {
        Map<String, Object> result = new HashMap<>();
        if (!StringUtils.hasText(cloudSyncUrl)) {
            result.put("pushed", 0);
            result.put("reason", "cloud-sync-url not configured");
            return result;
        }
        List<RevenueOutbox> rows = outboxRepository.findReadyForRetry(
            RETRY, Instant.now(), PageRequest.of(0, BATCH)
        ).stream().filter(this::isCloudBound).toList();
        if (rows.isEmpty()) {
            result.put("pushed", 0);
            result.put("batch", 0);
            return result;
        }
        List<Map<String, Object>> payload = rows.stream().map(this::toEvent).toList();
        try {
            RestClient client = RestClient.builder().baseUrl(cloudSyncUrl.replaceAll("/$", "")).build();
            var spec = client.post()
                .uri("/rst/edge/sync/ingest")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("events", payload));
            if (StringUtils.hasText(cloudSyncToken)) {
                spec = spec.header("Authorization", "Bearer " + cloudSyncToken);
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> response = spec.retrieve().body(Map.class);
            List<String> accepted = response == null ? List.of()
                : (List<String>) response.getOrDefault("acceptedKeys", List.of());
            int marked = 0;
            for (RevenueOutbox row : rows) {
                if (accepted.contains(row.getIdempotencyKey())) {
                    markSent(row);
                    marked++;
                } else {
                    markRetry(row, "not in acceptedKeys");
                }
            }
            result.put("pushed", marked);
            result.put("batch", payload.size());
            result.put("rejected", payload.size() - marked);
            return result;
        } catch (Exception ex) {
            String err = ex.getMessage() == null ? "cloud push failed" : ex.getMessage();
            for (RevenueOutbox row : rows) {
                markRetry(row, err);
            }
            result.put("pushed", 0);
            result.put("batch", payload.size());
            result.put("error", err);
            return result;
        }
    }

    private long countCloudBound(String status) {
        return outboxRepository.countByStatusAndChannelNotIn(status, STOCK_CHANNELS);
    }

    private boolean isCloudBound(RevenueOutbox row) {
        RevenueOutboxChannel ch = row.getChannel();
        return ch != null && !STOCK_CHANNELS.contains(ch);
    }

    private Map<String, Object> toEvent(RevenueOutbox r) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", r.getId());
        row.put("channel", r.getChannel().name());
        row.put("topic", r.getTopic());
        row.put("messageKey", r.getMessageKey());
        row.put("idempotencyKey", r.getIdempotencyKey());
        row.put("payload", r.getPayload());
        return row;
    }

    private void markSent(RevenueOutbox row) {
        row.setStatus("SENT");
        row.setLastError(null);
        row.setNextRetryAt(null);
        outboxRepository.save(row);
    }

    private void markRetry(RevenueOutbox row, String error) {
        int attempts = row.getAttempts() + 1;
        row.setAttempts(attempts);
        row.setStatus("FAILED");
        row.setLastError(error == null ? "retry" : error.substring(0, Math.min(error.length(), 500)));
        row.setNextRetryAt(Instant.now().plusSeconds(retryDelaySeconds(attempts)));
        outboxRepository.save(row);
    }

    private static long retryDelaySeconds(int attempts) {
        // 15s, 30s, 60s, … cap 15 min
        long delay = 15L * (1L << Math.min(Math.max(attempts - 1, 0), 6));
        return Math.min(delay, 900L);
    }
}
