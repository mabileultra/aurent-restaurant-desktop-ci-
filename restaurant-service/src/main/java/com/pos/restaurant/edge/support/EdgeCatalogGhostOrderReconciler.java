package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Close local OPEN/BILLING orders missing from cloud live export (ghost cleanup). */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogGhostOrderReconciler {

    private final JdbcTemplate jdbc;

    public Map<String, Object> apply(EdgeCatalogSnapshot snap) {
        Map<String, Object> out = new HashMap<>();
        out.put("closedGhostOrders", reconcileClosedLiveOrders(snap));
        return out;
    }

    /**
     * Close local OPEN/BILLING orders that cloud no longer reports as live
     * (paid/closed elsewhere — otherwise hall PC shows ghosts).
     */
    public int reconcileClosedLiveOrders(EdgeCatalogSnapshot snap) {
        // null = old cloud jar without live export — do not wipe local floor
        if (snap.openOrders() == null) return 0;
        List<OpenOrderRow> rows = snap.openOrders();
        Set<UUID> keep = new HashSet<>();
        for (OpenOrderRow row : rows) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE floor_orders
                SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
                WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
                """,
                Timestamp.from(now), Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 4];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE floor_orders
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?), updated_at = ?
            WHERE company_id = ? AND store_id = ? AND status IN ('OPEN', 'BILLING')
              AND id NOT IN (%s)
            """.formatted(placeholders),
            args
        );
    }

}
