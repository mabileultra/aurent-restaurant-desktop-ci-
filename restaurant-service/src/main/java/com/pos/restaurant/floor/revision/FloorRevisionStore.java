package com.pos.restaurant.floor.revision;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One row per company and store. Missing row reads as 0 and is not inserted on read.
 * {@code revision} is what the cashier polls. {@code origin} is published to the other node.
 * {@code seen_origin} stops a live pull from counting the same remote change twice.
 */
@Component
@RequiredArgsConstructor
public class FloorRevisionStore {

    private final JdbcTemplate jdbc;

    public long readRevision(Integer companyId, Integer storeId) {
        return readColumn("revision", companyId, storeId);
    }

    public long readOrigin(Integer companyId, Integer storeId) {
        return readColumn("origin", companyId, storeId);
    }

    public int increment(Integer companyId, Integer storeId) {
        return jdbc.update("""
            INSERT INTO store_floor_revision (company_id, store_id, revision, origin, seen_origin)
            VALUES (?, ?, 1, 1, 0)
            ON CONFLICT (company_id, store_id) DO UPDATE
            SET revision = store_floor_revision.revision + 1,
                origin = store_floor_revision.origin + 1
            """, companyId, storeId);
    }

    /**
     * @return 1 when this remote origin is newer than the one already applied
     */
    public int advanceSeenOrigin(Integer companyId, Integer storeId, long remoteOrigin) {
        return jdbc.update("""
            INSERT INTO store_floor_revision (company_id, store_id, revision, origin, seen_origin)
            VALUES (?, ?, 1, 0, ?)
            ON CONFLICT (company_id, store_id) DO UPDATE
            SET seen_origin = EXCLUDED.seen_origin,
                revision = store_floor_revision.revision + 1
            WHERE store_floor_revision.seen_origin < EXCLUDED.seen_origin
            """, companyId, storeId, remoteOrigin);
    }

    private long readColumn(String column, Integer companyId, Integer storeId) {
        var rows = jdbc.query(
            "SELECT " + column + " FROM store_floor_revision WHERE company_id = ? AND store_id = ?",
            (rs, rowNum) -> rs.getLong(1),
            companyId,
            storeId
        );
        return rows.isEmpty() ? 0L : rows.get(0);
    }
}
