package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.ShiftRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

/**
 * Live floor shift align (hall↔cloud and cloud→edge).
 * <ul>
 *   <li>Snapshot has OPEN → upsert that shift; close other OPEN for the store.</li>
 *   <li>Snapshot has none → close OPEN only when store has no OPEN/BILLING floor orders
 *       (empty hall). Keeps months-offline local open when tables still exist.</li>
 * </ul>
 * Runs on cloud ingest and edge import (same JDBC schema).
 */
@Component
@RequiredArgsConstructor
public class LiveShiftReconcile {

    private final JdbcTemplate jdbc;

    public int apply(EdgeCatalogSnapshot snap) {
        if (snap == null || snap.storeId() == null || snap.companyId() == null) {
            return 0;
        }
        ShiftRow row = snap.openShift();
        if (row == null || row.id() == null) {
            return closeOpenIfFloorEmpty(snap);
        }
        return upsertOpenShift(snap, row);
    }

    private int closeOpenIfFloorEmpty(EdgeCatalogSnapshot snap) {
        Integer openFloor = jdbc.queryForObject("""
            SELECT COUNT(*) FROM floor_orders
            WHERE store_id = ? AND company_id = ? AND status IN ('OPEN', 'BILLING')
            """,
            Integer.class,
            snap.storeId(),
            snap.companyId()
        );
        if (openFloor != null && openFloor > 0) {
            return 0;
        }
        Instant now = Instant.now();
        return jdbc.update("""
            UPDATE restaurant_shifts
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?)
            WHERE store_id = ? AND company_id = ? AND status = 'OPEN'
            """,
            Timestamp.from(now),
            snap.storeId(),
            snap.companyId()
        );
    }

    private int upsertOpenShift(EdgeCatalogSnapshot snap, ShiftRow row) {
        Instant now = Instant.now();
        jdbc.update("""
            UPDATE restaurant_shifts
            SET status = 'CLOSED', closed_at = COALESCE(closed_at, ?)
            WHERE store_id = ? AND status = 'OPEN' AND id <> ?
            """,
            Timestamp.from(now),
            snap.storeId(),
            row.id()
        );
        UUID openedBy = row.openedByUserId() == null ? UUID.randomUUID() : row.openedByUserId();
        Instant openedAt = row.openedAt() == null ? now : row.openedAt();
        jdbc.update("""
            INSERT INTO restaurant_shifts (
              id, company_id, store_id, status, opened_by_user_id, opened_at, opening_cash,
              sale_count, total_amount, cash_amount, card_amount, comment,
              handover_expected, handover_diff
            ) VALUES (?, ?, ?, 'OPEN', ?, ?, ?, 0, 0, 0, 0, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              company_id = EXCLUDED.company_id,
              store_id = EXCLUDED.store_id,
              status = 'OPEN',
              opened_by_user_id = EXCLUDED.opened_by_user_id,
              opened_at = EXCLUDED.opened_at,
              opening_cash = EXCLUDED.opening_cash,
              comment = EXCLUDED.comment,
              handover_expected = EXCLUDED.handover_expected,
              handover_diff = EXCLUDED.handover_diff,
              closed_at = NULL,
              closed_by_user_id = NULL
            """,
            row.id(),
            snap.companyId(),
            snap.storeId(),
            openedBy,
            Timestamp.from(openedAt),
            row.openingCash() == null ? BigDecimal.ZERO : row.openingCash(),
            row.comment(),
            row.handoverExpected(),
            row.handoverDiff()
        );
        return 1;
    }
}
