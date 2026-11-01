package com.pos.restaurant.edge.support;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * Catalog cloud→edge pull: last-write-wins by {@code updated_at}.
 * Null remote timestamp → do not overwrite an existing local row (only INSERT new ids).
 */
public final class EdgeCatalogLww {

    private EdgeCatalogLww() {}

    /** Bind for INSERT/UPDATE; null stays SQL NULL (LWW WHERE skips overwrite). */
    public static Timestamp bind(Instant updatedAt) {
        return updatedAt == null ? null : Timestamp.from(updatedAt);
    }

    /** created_at on insert-only path when row has no clock. */
    public static Timestamp createdOrNow(Instant updatedAt, Instant now) {
        return Timestamp.from(updatedAt != null ? updatedAt : now);
    }

    /**
     * Append to {@code ON CONFLICT … DO UPDATE SET …}.
     * Requires EXCLUDED.updated_at column in the INSERT list.
     */
    public static String whereNotOlderThan(String table) {
        return " WHERE EXCLUDED.updated_at IS NOT NULL"
            + " AND (" + table + ".updated_at IS NULL OR EXCLUDED.updated_at >= " + table + ".updated_at)";
    }
}
