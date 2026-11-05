package com.pos.taxanalytics.repository;

import com.pos.taxanalytics.support.TaxAnalyticsPeriod;
import com.pos.taxanalytics.support.TaxAnalyticsWeekWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class TaxAnalyticsReportQueryRepository {

    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> daily(TaxAnalyticsPeriod period) {
        return jdbc.queryForList(
            """
                SELECT (s.created_at AT TIME ZONE 'Asia/Tashkent')::date AS day,
                       COALESCE(SUM(CASE WHEN s.fiscal_status = 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS fiscal_turnover,
                       COALESCE(SUM(CASE WHEN s.fiscal_status IS DISTINCT FROM 'FISCALIZED' THEN s.total_amount ELSE 0 END), 0) AS non_fiscal_turnover
                FROM sales s
                WHERE s.status = 'COMPLETED'
                  AND s.created_at >= ? AND s.created_at < ?
                GROUP BY 1
                ORDER BY 1
                """,
            ts(period.from()),
            ts(period.to().plusDays(1))
        );
    }

    public long countReceipts(TaxAnalyticsPeriod period) {
        Long n = jdbc.queryForObject(
            """
                SELECT COUNT(*)
                FROM sales s
                WHERE s.status = 'COMPLETED'
                  AND s.created_at >= ? AND s.created_at < ?
                """,
            Long.class,
            ts(period.from()),
            ts(period.to().plusDays(1))
        );
        return n == null ? 0L : n;
    }

    public List<Map<String, Object>> receipts(TaxAnalyticsPeriod period, int limit, int offset) {
        return jdbc.queryForList(
            """
                SELECT s.id::text AS sale_id, s.receipt_number, s.created_at, st.name AS store_name,
                       s.total_amount, s.fiscal_status,
                       NULLIF(BTRIM(s.fiscal_qr_url), '') IS NOT NULL AS has_qr
                FROM sales s
                LEFT JOIN stores st ON st.id = s.store_id
                WHERE s.status = 'COMPLETED'
                  AND s.created_at >= ? AND s.created_at < ?
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?
                """,
            ts(period.from()),
            ts(period.to().plusDays(1)),
            limit,
            offset
        );
    }

    private static Timestamp ts(LocalDate day) {
        return Timestamp.from(day.atStartOfDay(TaxAnalyticsWeekWindow.ZONE).toInstant());
    }
}
