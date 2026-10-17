package com.pos.restaurant.edge.service;

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
 * Pushes PENDING/FAILED non-stock outbox rows to cloud restaurant-service ingest.
 * Cloud must expose {@code POST /rst/edge/sync/ingest}.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCloudSyncService {

    private static final List<String> RETRY = List.of("PENDING", "FAILED");

    private final RevenueOutboxRepository outboxRepository;

    @Value("${app.restaurant.edge.cloud-sync-url:}")
    private String cloudSyncUrl;

    @Value("${app.restaurant.edge.cloud-sync-token:}")
    private String cloudSyncToken;

    @Transactional(readOnly = true)
    public Map<String, Object> status() {
        long pending = outboxRepository.countByStatus("PENDING");
        long failed = outboxRepository.countByStatus("FAILED");
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
            RETRY, Instant.now(), PageRequest.of(0, 50)
        );
        // Only non-stock channels need cloud (stock already applied locally on edge)
        List<Map<String, Object>> payload = rows.stream()
            .filter(r -> r.getChannel() != null && !r.getChannel().name().startsWith("STOCK_"))
            .map(r -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", r.getId());
                row.put("channel", r.getChannel().name());
                row.put("topic", r.getTopic());
                row.put("messageKey", r.getMessageKey());
                row.put("idempotencyKey", r.getIdempotencyKey());
                row.put("payload", r.getPayload());
                return row;
            })
            .toList();
        if (payload.isEmpty()) {
            result.put("pushed", 0);
            return result;
        }
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
                    row.setStatus("SENT");
                    row.setLastError(null);
                    row.setNextRetryAt(null);
                    outboxRepository.save(row);
                    marked++;
                }
            }
            result.put("pushed", marked);
            result.put("batch", payload.size());
            return result;
        } catch (Exception ex) {
            result.put("pushed", 0);
            result.put("error", ex.getMessage());
            return result;
        }
    }
}
