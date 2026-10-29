package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.KitchenTicketRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/** Close OPEN/BILLING (and cancel stale tickets) absent from hall push snapshot. */
@Component
@RequiredArgsConstructor
public class LiveFloorGhostReconcile {

    private final JdbcTemplate jdbc;

    int reconcileOpen(EdgeCatalogSnapshot snap) {
        // null = field omitted (partial payload) — never mass-close.
        // empty list = deliberate empty floor from hall push — close leftovers.
        if (snap.openOrders() == null) return 0;
        Set<UUID> keep = new HashSet<>();
        for (OpenOrderRow row : snap.openOrders()) {
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
            """.formatted(placeholders), args);
    }

    int reconcileTickets(EdgeCatalogSnapshot snap) {
        if (snap.kitchenTickets() == null) return 0;
        Set<UUID> keep = new HashSet<>();
        for (KitchenTicketRow row : snap.kitchenTickets()) {
            if (row.id() != null) keep.add(row.id());
        }
        Instant now = Instant.now();
        if (keep.isEmpty()) {
            return jdbc.update("""
                UPDATE kitchen_tickets SET status = 'CANCELLED', updated_at = ?
                WHERE company_id = ? AND store_id = ? AND status NOT IN ('SERVED', 'CANCELLED')
                """,
                Timestamp.from(now), snap.companyId(), snap.storeId()
            );
        }
        String placeholders = String.join(",", keep.stream().map(id -> "?").toList());
        Object[] args = new Object[keep.size() + 3];
        int i = 0;
        args[i++] = Timestamp.from(now);
        args[i++] = snap.companyId();
        args[i++] = snap.storeId();
        for (UUID id : keep) args[i++] = id;
        return jdbc.update("""
            UPDATE kitchen_tickets SET status = 'CANCELLED', updated_at = ?
            WHERE company_id = ? AND store_id = ? AND status NOT IN ('SERVED', 'CANCELLED')
              AND id NOT IN (%s)
            """.formatted(placeholders), args);
    }

}
