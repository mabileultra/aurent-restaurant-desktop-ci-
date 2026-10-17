package com.pos.restaurant.edge.controller;

import com.pos.restaurant.revenue.domain.RevenueOutboxChannel;
import com.pos.restaurant.revenue.entity.RevenueOutbox;
import com.pos.restaurant.revenue.service.RevenueOutboxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Cloud-side ingest for edge outbox events (idempotent by idempotencyKey).
 * Always available — edge PCs POST here when uplink is up.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Edge sync")
public class EdgeSyncIngestController {

    private final RevenueOutboxService revenueOutboxService;

    @PostMapping("/rst/edge/sync/ingest")
    @Operation(summary = "Accept outbox events from restaurant-desktop edge")
    public ResponseEntity<Map<String, Object>> ingest(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = body == null ? List.of()
            : (List<Map<String, Object>>) body.getOrDefault("events", List.of());
        List<String> accepted = new ArrayList<>();
        for (Map<String, Object> ev : events) {
            if (ev == null) continue;
            String key = str(ev.get("idempotencyKey"));
            String channel = str(ev.get("channel"));
            String topic = str(ev.get("topic"));
            String messageKey = str(ev.get("messageKey"));
            String payload = str(ev.get("payload"));
            if (!StringUtils.hasText(key) || !StringUtils.hasText(channel)) continue;
            RevenueOutboxChannel ch;
            try {
                ch = RevenueOutboxChannel.valueOf(channel);
            } catch (Exception ex) {
                continue;
            }
            RevenueOutbox row = revenueOutboxService.enqueue(
                ch,
                topic == null ? "" : topic,
                messageKey == null ? key : messageKey,
                key,
                payload == null ? "{}" : payload
            );
            revenueOutboxService.trySend(row.getId());
            accepted.add(key);
        }
        return ResponseEntity.ok(Map.of("acceptedKeys", accepted, "count", accepted.size()));
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
