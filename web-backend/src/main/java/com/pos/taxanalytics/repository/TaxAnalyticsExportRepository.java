package com.pos.taxanalytics.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsExportRepository {

    private final JdbcTemplate jdbc;

    public void insert(UUID id, LocalDate from, LocalDate to, String filename, String csv) {
        jdbc.update(
            """
                INSERT INTO tax_analytics_export (id, created_at, period_from, period_to, filename, csv_body)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
            id,
            Timestamp.from(Instant.now()),
            Date.valueOf(from),
            Date.valueOf(to),
            filename,
            csv
        );
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList(
            """
                SELECT id::text AS id, created_at, period_from, period_to, filename
                FROM tax_analytics_export
                ORDER BY created_at DESC
                LIMIT 100
                """
        );
    }

    public String csv(UUID id) {
        List<String> rows = jdbc.query(
            "SELECT csv_body FROM tax_analytics_export WHERE id = ?",
            (rs, row) -> rs.getString(1),
            id
        );
        return rows.isEmpty() ? null : rows.get(0);
    }
}
