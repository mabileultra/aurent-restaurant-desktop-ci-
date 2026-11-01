package com.pos.restaurant.edge.support;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogSequenceSync {

    private final JdbcTemplate jdbc;

    public void syncSequences() {
        try {
            jdbc.execute("SELECT setval(pg_get_serial_sequence('floor_halls','id'), COALESCE((SELECT MAX(id) FROM floor_halls), 1))");
            jdbc.execute("SELECT setval(pg_get_serial_sequence('floor_tables','id'), COALESCE((SELECT MAX(id) FROM floor_tables), 1))");
        } catch (Exception ignored) {
            /* non-postgres or empty */
        }
    }
}
