package com.pos.restaurant.edge.support;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EdgeCatalogLwwTest {

    @Test
    void bindNullStaysNull() {
        assertNull(EdgeCatalogLww.bind(null));
    }

    @Test
    void whereRequiresRemoteTimestamp() {
        String w = EdgeCatalogLww.whereNotOlderThan("menu_items");
        assertTrue(w.contains("EXCLUDED.updated_at IS NOT NULL"));
        assertTrue(w.contains("menu_items.updated_at"));
    }

    @Test
    void createdOrNowFallsBack() {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        assertTrue(EdgeCatalogLww.createdOrNow(null, now).toInstant().equals(now));
        Instant row = Instant.parse("2025-06-01T00:00:00Z");
        assertTrue(EdgeCatalogLww.createdOrNow(row, now).toInstant().equals(row));
    }
}
