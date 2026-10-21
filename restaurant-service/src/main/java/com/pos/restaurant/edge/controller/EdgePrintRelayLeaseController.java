package com.pos.restaurant.edge.controller;

import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * LAN-wide single print-relay leader (replaces per-browser localStorage lock).
 * Heartbeat every ~1.5s; stale after 4s → another desktop may take over.
 */
@RestController
@RequestMapping("/edge/print-relay")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgePrintRelayLeaseController {

    private static final long STALE_MS = 4_000;

    private final JdbcTemplate jdbc;

    @PostMapping("/lease")
    public ResponseEntity<Map<String, Object>> lease(@RequestBody Map<String, Object> body) {
        Integer storeId = body.get("storeId") instanceof Number n ? n.intValue() : null;
        String ownerId = body.get("ownerId") == null ? null : String.valueOf(body.get("ownerId")).trim();
        String ownerLabel = body.get("ownerLabel") == null ? null : String.valueOf(body.get("ownerLabel"));
        if (storeId == null || !StringUtils.hasText(ownerId)) {
            throw new BusinessException("storeId and ownerId required");
        }
        Instant now = Instant.now();
        Instant staleBefore = now.minusMillis(STALE_MS);
        Timestamp nowTs = Timestamp.from(now);
        Timestamp staleTs = Timestamp.from(staleBefore);

        // Atomic upsert: take lease if free/stale/ours; otherwise keep current owner.
        jdbc.update("""
            INSERT INTO edge_print_relay_lease (store_id, owner_id, owner_label, heartbeat_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (store_id) DO UPDATE SET
              owner_id = CASE
                WHEN edge_print_relay_lease.owner_id = EXCLUDED.owner_id
                  OR edge_print_relay_lease.heartbeat_at < ?
                THEN EXCLUDED.owner_id
                ELSE edge_print_relay_lease.owner_id
              END,
              owner_label = CASE
                WHEN edge_print_relay_lease.owner_id = EXCLUDED.owner_id
                  OR edge_print_relay_lease.heartbeat_at < ?
                THEN EXCLUDED.owner_label
                ELSE edge_print_relay_lease.owner_label
              END,
              heartbeat_at = CASE
                WHEN edge_print_relay_lease.owner_id = EXCLUDED.owner_id
                  OR edge_print_relay_lease.heartbeat_at < ?
                THEN EXCLUDED.heartbeat_at
                ELSE edge_print_relay_lease.heartbeat_at
              END
            """,
            storeId, ownerId, ownerLabel, nowTs,
            staleTs, staleTs, staleTs
        );

        String current = jdbc.queryForObject(
            "SELECT owner_id FROM edge_print_relay_lease WHERE store_id = ?",
            String.class,
            storeId
        );
        boolean leader = ownerId.equals(current);
        Map<String, Object> out = new HashMap<>();
        out.put("leader", leader);
        out.put("ownerId", ownerId);
        out.put("storeId", storeId);
        out.put("staleMs", STALE_MS);
        return ResponseEntity.ok(out);
    }
}
