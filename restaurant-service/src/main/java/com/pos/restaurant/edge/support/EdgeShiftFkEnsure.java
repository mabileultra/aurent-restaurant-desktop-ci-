package com.pos.restaurant.edge.support;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.OpenOrderRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Inserts stub CLOSED shifts for any order.shift_id missing locally.
 * Cloud often references a closed shift while snapshot.openShift is null —
 * floor_orders.fk_floor_orders_shift would otherwise fail on bootstrap/live-import.
 * Always on (cloud ingest + edge): {@link com.pos.restaurant.edge.live.LiveFloorApplyService} needs this bean.
 */
@Component
@RequiredArgsConstructor
public class EdgeShiftFkEnsure {

    private final JdbcTemplate jdbc;

    public int ensureForOrders(EdgeCatalogSnapshot snap) {
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            return 0;
        }
        Set<UUID> ids = new LinkedHashSet<>();
        collect(snap.openOrders(), ids);
        collect(snap.closedOrders(), ids);
        if (snap.openShift() != null && snap.openShift().id() != null) {
            ids.add(snap.openShift().id());
        }
        if (ids.isEmpty()) {
            return 0;
        }
        Instant now = Instant.now();
        UUID openedBy = UUID.randomUUID();
        int n = 0;
        for (UUID id : ids) {
            n += jdbc.update("""
                INSERT INTO restaurant_shifts (
                  id, company_id, store_id, status, opened_by_user_id, opened_at, opening_cash,
                  sale_count, total_amount, cash_amount, card_amount, closed_at
                ) VALUES (?, ?, ?, 'CLOSED', ?, ?, ?, 0, 0, 0, 0, ?)
                ON CONFLICT (id) DO NOTHING
                """,
                id,
                snap.companyId(),
                snap.storeId(),
                openedBy,
                Timestamp.from(now),
                BigDecimal.ZERO,
                Timestamp.from(now)
            );
        }
        return n;
    }

    private static void collect(List<OpenOrderRow> rows, Set<UUID> ids) {
        if (rows == null) {
            return;
        }
        for (OpenOrderRow row : rows) {
            if (row != null && row.shiftId() != null) {
                ids.add(row.shiftId());
            }
        }
    }
}
