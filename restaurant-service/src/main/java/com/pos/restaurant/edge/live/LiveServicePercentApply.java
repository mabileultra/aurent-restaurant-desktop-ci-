package com.pos.restaurant.edge.live;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.HallRow;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot.TableRow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;

/**
 * Copy hall and table service percent onto an already-bootstrapped edge.
 * Does not insert tables or touch status — local opens stay put.
 */
@Component
@RequiredArgsConstructor
public class LiveServicePercentApply {

    private final JdbcTemplate jdbc;

    public int apply(EdgeCatalogSnapshot snap) {
        Instant now = Instant.now();
        int updated = 0;
        if (snap.halls() != null) {
            for (HallRow row : snap.halls()) {
                if (row.id() == null) continue;
                updated += jdbc.update("""
                    UPDATE floor_halls
                       SET service_percent = ?, updated_at = ?
                     WHERE id = ? AND company_id = ? AND store_id = ?
                    """,
                    row.servicePercent() == null ? BigDecimal.ZERO : row.servicePercent(),
                    Timestamp.from(now),
                    row.id(),
                    snap.companyId(),
                    snap.storeId()
                );
            }
        }
        if (snap.tables() != null) {
            for (TableRow row : snap.tables()) {
                if (row.id() == null) continue;
                updated += jdbc.update("""
                    UPDATE floor_tables
                       SET service_percent = ?, updated_at = ?
                     WHERE id = ? AND company_id = ? AND store_id = ?
                    """,
                    row.servicePercent(),
                    Timestamp.from(now),
                    row.id(),
                    snap.companyId(),
                    snap.storeId()
                );
            }
        }
        return updated;
    }
}
